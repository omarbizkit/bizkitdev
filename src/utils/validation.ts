export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return emailRegex.test(email)
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

export function validateContactForm(data: {
  name: string
  email: string
  subject: string
  message: string
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long'
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  if (!data.subject || data.subject.trim().length < 5) {
    errors.subject = 'Subject must be at least 5 characters long'
  }
  
  if (!data.message || data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function isStrongPassword(password: string): boolean {
  return validatePassword(password).isValid
}