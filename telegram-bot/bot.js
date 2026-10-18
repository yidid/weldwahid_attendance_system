const QRCode = require('qrcode')
const { generateRawToken, hashToken, buildQrText } = require('./qrToken')
const { formatEthiopianDate } = require('./dateFormatting')
require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')
const { db, FieldValue } = require('./firebaseAdmin')
const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is missing. Check your .env file.')
}

const bot = new TelegramBot(token, { polling: true })

const MAIN_MENU_KEYBOARD = {
  reply_markup: {
    keyboard: [
      ['📱 My QR Code', '📋 My Attendance'],
      ['👤 My Profile', '📊 My Statistics'],
    ],
    resize_keyboard: true,
  },
}
const RECORDS_PER_PAGE = 5


async function findStudentByTelegramId(telegramId) {
  const snapshot = await db
    .collection('students')
    .where('telegramId', '==', String(telegramId))
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}
async function requireLinkedStudent(chatId, telegramId) {
  const student = await findStudentByTelegramId(telegramId)

  if (!student) {
    await bot.sendMessage(
      chatId,
      'Your account is not linked yet. Please see an administrator, ' +
        `and give them this Telegram ID:\n\n\`${telegramId}\``,
      { parse_mode: 'Markdown' }
    )
    return null
  }

  return student
}
async function getStudentAttendanceHistory(studentId) {
  const snapshot = await db
    .collection('attendance')
    .where('studentId', '==', studentId)
    .orderBy('date', 'desc')
    .get()

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

async function getTotalSessionDates() {
  const snapshot = await db.collection('attendance').select('date').get()
  const uniqueDates = new Set()

  snapshot.docs.forEach((doc) => {
    uniqueDates.add(doc.data().date)
  })

  return uniqueDates
}

function formatAttendancePage(records, page) {
  const totalPages = Math.max(Math.ceil(records.length / RECORDS_PER_PAGE), 1)
  const start = page * RECORDS_PER_PAGE
  const pageRecords = records.slice(start, start + RECORDS_PER_PAGE)

  let text = '📋 MY ATTENDANCE\n\n'

  if (pageRecords.length === 0) {
    text += 'No attendance records found.'
  } else {
    pageRecords.forEach((record) => {
      text += `${formatEthiopianDate(record.date)}\n`

      if (record.status === 'inside' || record.status === 'completed') {
        text += '✅ ተገኝተዋል \n'
        if (record.entryTime) {
          const entryTime = record.entryTime.toDate().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
          text += `🟢 የገቡበት ሰአት: ${entryTime}\n`
        }
        if (record.exitTime) {
          const exitTime = record.exitTime.toDate().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
          text += `🔴 የወጡበት ሰአት: ${exitTime}\n`
        }
      } else {
        text += '❌ ቀሪ \n'
      }

      text += '\n'
    })
  }

  text += `Page ${page + 1} of ${totalPages}`

  return { text, totalPages }
}

function buildPaginationKeyboard(page, totalPages) {
  const buttons = []

  if (page > 0) {
    buttons.push({ text: '⬅️ Previous', callback_data: `attendance_page_${page - 1}` })
  }
  if (page < totalPages - 1) {
    buttons.push({ text: 'Next ➡️', callback_data: `attendance_page_${page + 1}` })
  }

  return { reply_markup: { inline_keyboard: buttons.length > 0 ? [buttons] : [] } }
}
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  try {
    const student = await findStudentByTelegramId(telegramId)

    if (!student) {
      await bot.sendMessage(
        chatId,
        'እንኳን ወደ ወልድ ዋህድ የመዝሙር ክፍል አቴንዳንስ መጡ 👋\n\n' +
          'የቴሌግራም አካውንቶ ከግል ማህደሮ ጋር አልተገናኘም። \n\n' +
          'እባክዎን የመዝሙር ክፍል አባላትን ከታች የተሰጠውን ቁጥር በመስጠት ከግል ማህድሮ(profile) ጋር እንዲያገናኙሎት ይጠይቁ ።' +
          'የቴሌግራም ID ቁጥሮ :\n\n' +
          `\`${telegramId}\``,
          'ለመዝሙር ክፍል አባላት የቴሌግራም አካውንትዎን እንዲያገናኙ ይጠይቁ።`,',
        { parse_mode: 'Markdown' }
      )
      return
    }

    await bot.sendMessage(
      chatId,
      `Welcome back, ${student.name}! 👋\n\nUse the menu below to get started.`,
      MAIN_MENU_KEYBOARD
    )
  } catch (err) {
    console.error('Error in /start:', err)
    await bot.sendMessage(chatId, 'Something went wrong. Please try again later.')
  }
})
bot.onText(/👤 My Profile/, async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  try {
    const student = await requireLinkedStudent(chatId, telegramId)
    if (!student) return

    let className = 'No Class'
    if (student.classId) {
      const classDoc = await db.collection('classes').doc(student.classId).get()
      if (classDoc.exists) {
        className = classDoc.data().name
      }
    }

    const message =
      `👤 My Profile\n\n` +
      `Name:\n${student.name}\n\n` +
      `Student ID:\n${student.studentId}\n\n` +
      `Class:\n${className}\n\n` +
      `Status:\n${student.status === 'active' ? 'Active' : 'Inactive'}`

    await bot.sendMessage(chatId, message)
  } catch (err) {
    console.error('Error in My Profile:', err)
    await bot.sendMessage(chatId, 'Something went wrong. Please try again later.')
  }
})
bot.onText(/\/link (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id
  const submittedCode = match[1].trim()

  try {
    const existingLink = await findStudentByTelegramId(telegramId)
    if (existingLink) {
      await bot.sendMessage(
        chatId,
        `Your Telegram account is already linked to ${existingLink.name}. ` +
          'Contact an administrator if this is incorrect.'
      )
      return
    }

    const snapshot = await db
      .collection('students')
      .where('linkCode', '==', submittedCode)
      .limit(1)
      .get()

    if (snapshot.empty) {
      await bot.sendMessage(chatId, '❌ Invalid or already-used code. Ask an administrator for a new one.')
      return
    }

    const studentDoc = snapshot.docs[0]
    const studentData = studentDoc.data()

    if (!studentData.linkCodeExpiresAt || Date.now() > studentData.linkCodeExpiresAt) {
      await bot.sendMessage(chatId, '❌ This code has expired. Ask an administrator for a new one.')
      return
    }

    await studentDoc.ref.update({
      telegramId: String(telegramId),
      linkCode: FieldValue.delete(),
      linkCodeExpiresAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    await bot.sendMessage(
      chatId,
      `✅ Success! Your Telegram account is now linked to ${studentData.name}.\n\n` +
        'Use the menu below to get started.',
      MAIN_MENU_KEYBOARD
    )
  } catch (err) {
    console.error('Error in /link:', err)
    await bot.sendMessage(chatId, 'Something went wrong. Please try again later.')
  }
})

bot.onText(/📋 My Attendance/, async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  try {
    const student = await requireLinkedStudent(chatId, telegramId)
    if (!student) return

    const records = await getStudentAttendanceHistory(student.id)
    const { text, totalPages } = formatAttendancePage(records, 0)
    const keyboard = buildPaginationKeyboard(0, totalPages)

    await bot.sendMessage(chatId, text, keyboard)
  } catch (err) {
    console.error('Error in My Attendance:', err)
    await bot.sendMessage(chatId, 'Something went wrong. Please try again later.')
  }
})

bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data
  const chatId = callbackQuery.message.chat.id
  const telegramId = callbackQuery.from.id
  const messageId = callbackQuery.message.message_id

  if (!data.startsWith('attendance_page_')) {
    return
  }

  try {
    const student = await requireLinkedStudent(chatId, telegramId)
    if (!student) return

    const page = parseInt(data.replace('attendance_page_', ''), 10)
    const records = await getStudentAttendanceHistory(student.id)
    const { text, totalPages } = formatAttendancePage(records, page)
    const keyboard = buildPaginationKeyboard(page, totalPages)

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard.reply_markup,
    })

    await bot.answerCallbackQuery(callbackQuery.id)
  } catch (err) {
    console.error('Error in attendance pagination:', err)
    await bot.answerCallbackQuery(callbackQuery.id, { text: 'Something went wrong.' })
  }
})

bot.onText(/📊 My Statistics/, async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  try {
    const student = await requireLinkedStudent(chatId, telegramId)
    if (!student) return

    const [studentRecords, allSessionDates] = await Promise.all([
      getStudentAttendanceHistory(student.id),
      getTotalSessionDates(),
    ])

    const totalSundays = allSessionDates.size
    const present = studentRecords.length
    const absent = Math.max(totalSundays - present, 0)
    const attendanceRate = totalSundays > 0 ? ((present / totalSundays) * 100).toFixed(2) : '0.00'

    const message =
      `📊 Attendance Statistics\n\n` +
      `ጠቅላላ ጥናት: ${totalSundays}\n` +
      `የተገኙበት ቀናት: ${present}\n` +
      `የቀሩበት ቀናት: ${absent}\n` +
      `የመገኘት መጠን: ${attendanceRate}%`

    await bot.sendMessage(chatId, message)
  } catch (err) {
    console.error('Error in My Statistics:', err)
    await bot.sendMessage(chatId, 'Something went wrong. Please try again later.')
  }
})

bot.onText(/📱 My QR Code/, async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  try {
    const student = await requireLinkedStudent(chatId, telegramId)
    if (!student) return

    const rawToken = generateRawToken()
    const tokenHash = hashToken(rawToken)
    const qrText = buildQrText(rawToken)

    await db.collection('students').doc(student.id).update({
      qrTokenHash: tokenHash,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const qrImageBuffer = await QRCode.toBuffer(qrText, { width: 400 })

    await bot.sendPhoto(chatId, qrImageBuffer, {
      caption:
        `📱 My QR Code\n\n${student.name} — ${student.studentId}\n\n` +
        `ይህን QR Code ለመዝሙር ክፍል አባላት ሲገቡ እና ሲወጡ scan ያስደርጉ ` +
        ` የመግቢያ እና የመውጫ ሰአቶ ይመዘገባል`,
    })
  } catch (err) {
    console.error('Error in My QR Code:', err)
    await bot.sendMessage(chatId, 'Something went wrong. Please try again later.')
  }
})


console.log('Telegram bot started (polling mode)...')

module.exports = { bot, findStudentByTelegramId, MAIN_MENU_KEYBOARD }