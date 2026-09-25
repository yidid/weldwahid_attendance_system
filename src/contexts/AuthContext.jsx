import { createContext, useContext, useEffect, useState } from 'react'
import {
  subscribeToAuthChanges,
  getUserProfile,
  loginWithEmail,
  logout as logoutService,
} from '../services/authService'

const AuthContext = createContext(null)

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

      try {
        const profile = await getUserProfile(firebaseUser.uid)

        if (!profile) {
          setError('No profile found for this account. Contact an administrator.')
          setUserProfile(null)
        } else {
          setUserProfile(profile)
        }
      } catch (err) {
        setError('Failed to load user profile.')
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function login(email, password) {
    setError('')
    await loginWithEmail(email, password)
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