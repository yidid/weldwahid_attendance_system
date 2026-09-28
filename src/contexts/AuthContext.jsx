import { createContext, useContext, useEffect, useState } from 'react'
import {
  subscribeToAuthChanges,
  getUserProfile,
  loginWithEmail,
  logout as logoutService,
} from '../services/authService'

const AuthContext = createContext(null)

function withProfileTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timed out')), ms)
    ),
  ])
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setError('')

      if (!firebaseUser) {
        setCurrentUser(null)
        setUserProfile(null)
        setLoading(false)
        return
      }

      setCurrentUser(firebaseUser)
      setLoading(true)

      try {
        const profile = await withProfileTimeout(getUserProfile(firebaseUser.uid))

        if (!profile) {
          console.warn('AuthContext: No user profile document found for uid:', firebaseUser.uid)
          setError('No profile found for this account. Contact an administrator.')
          setUserProfile(null)
        } else {
          setUserProfile(profile)
          setError('')
        }
      } catch (err) {
        console.error('AuthContext: Failed to load user profile:', err)
        setError('Failed to load user profile.')
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  async function login(email, password) {
    setError('')
    // Don't set loading here — the onAuthStateChanged listener
    // will fire and manage the loading state itself.
    try {
      await loginWithEmail(email, password)
      // onAuthStateChanged will handle setting loading/profile
    } catch (error) {
      throw error
    }
  }

  async function logout() {
    setError('')
    await logoutService()
    setCurrentUser(null)
    setUserProfile(null)
  }

  const value = {
    currentUser,
    userProfile,
    role: userProfile ? userProfile.role : null,
    isAdmin: userProfile ? userProfile.role === 'admin' : false,
    isTeacher: userProfile ? userProfile.role === 'teacher' : false,
    loading,
    error,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}