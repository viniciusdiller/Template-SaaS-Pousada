import bcrypt from 'bcryptjs';

const DEMO_EMAIL = 'admin@pousadasancho.com';
const DEMO_PASSWORD = 'sancho123';
const DEMO_PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

export const authConfig = {
  cookieName: 'sancho_session',
  demoCredentials: {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  },
  passwordHash: DEMO_PASSWORD_HASH,
};

export async function validateCredentials(email: string, password: string) {
  if (email !== DEMO_EMAIL) {
    return false;
  }

  return bcrypt.compare(password, DEMO_PASSWORD_HASH);
}
