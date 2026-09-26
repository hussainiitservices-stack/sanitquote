export type ApiErrorBody = {
  error: {
    message: string
    code?: string
  }
}

export function jsonData<T>(data: T, status = 200) {
  return Response.json({ data }, { status })
}

export function jsonError(message: string, status: number, code?: string) {
  const body: ApiErrorBody = {
    error: code ? { message, code } : { message },
  }
  return Response.json(body, { status })
}
