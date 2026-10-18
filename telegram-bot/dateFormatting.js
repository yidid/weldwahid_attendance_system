const ETHIOPIAN_DATE_FORMATTER = new Intl.DateTimeFormat(
  'am-ET-u-ca-ethiopic',
  {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Addis_Ababa',
  }
)

function formatEthiopianDate(dateString) {
  if (!dateString) return '—'

  const date = new Date(`${dateString}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return dateString

  return ETHIOPIAN_DATE_FORMATTER.format(date)
}

module.exports = { formatEthiopianDate }
