import api from '../api/api'

const SESSION_KEY = 'afribus_auth'
const SESSION_CONTEXT_KEY = 'afribus_auth_context'

function resolveSessionContext(user) {
  if (!user) return null
  if (user.company_id) return 'company'
  if (['admin', 'super_admin'].includes(user.role)) return 'admin'
  if (user.role === 'client') return 'client'
  return null
}

export function setAuthSession({ token, user }, context = resolveSessionContext(user)) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem(SESSION_CONTEXT_KEY, context || '')
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      ...user,
      context,
      at: Date.now(),
    })
  )
}

export async function login(identifier, password) {
  if (!identifier?.trim() || !password) {
    throw new Error('Veuillez remplir tous les champs.')
  }

  const { data } = await api.post('/login', {
    email: identifier.trim(),
    identifier: identifier.trim(),
    password,
  })

  if (data.user?.role !== 'client' || data.user?.company_id) {
    throw new Error('Ce compte appartient a un espace administrateur ou compagnie. Utilisez la connexion de gestion.')
  }

  setAuthSession(data, 'client')
  return data.user
}

export async function register({ name, phone, email, password, passwordConfirmation }) {
  if (!name?.trim() || !phone?.trim() || !email?.trim() || !password) {
    throw new Error('Nom, telephone, e-mail et mot de passe sont obligatoires.')
  }

  const { data } = await api.post('/register', {
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    password,
    password_confirmation: passwordConfirmation,
  })

  setAuthSession(data, 'client')
  return data.user
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_CONTEXT_KEY)
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function isAuthenticated() {
  return !!localStorage.getItem('token') && !!localStorage.getItem('user')
}

export function getSessionUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function getSessionContext() {
  return localStorage.getItem(SESSION_CONTEXT_KEY) || resolveSessionContext(getSessionUser())
}
