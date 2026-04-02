export class AuthError extends Error {
  constructor(message: string = "Token tidak valid") {
    super(message);
    this.name = "AuthError";
  }
}

export class DuplicateEmailError extends Error {
  constructor(message: string = "Email already registered") {
    super(message);
    this.name = "DuplicateEmailError";
  }
}
