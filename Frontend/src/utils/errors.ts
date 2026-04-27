export function mapBackendErrors(error: any): Record<string, string> {
  const fieldErrors = error?.response?.data?.errors

  if (fieldErrors && typeof fieldErrors === 'object') {
    const mapped: Record<string, string> = {}

    for (const [field, messages] of Object.entries(fieldErrors)) {
      mapped[field] = Array.isArray(messages) ? String(messages[0]) : String(messages)
    }

    return mapped
  }

  const message =
    error?.response?.data?.message || error?.message || 'Ocorreu um erro inesperado. Tente novamente.'

  return { form: String(message) }
}
