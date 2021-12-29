import database from 'infra/database.js';
import Joi from 'joi';
import { ValidationError, NotFoundError } from 'errors/index.js';

export default function User() {
  async function findAll() {
    try {
      const query = {
        text: 'SELECT * FROM users',
      };
      const results = await database.query(query);
      return results.rows;
    } catch (error) {
      throw error;
    }
  }

  async function findOneByUsername(username) {
    const query = {
      text: 'SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1;',
      values: [username],
    };

    const results = await database.query(query);

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: `O username "${username}" não foi encontrado no sistema.`,
        action: 'Verifique se o "username" está digitado corretamente.',
        stack: new Error().stack,
      });
    }

    return results.rows[0];
  }

  async function create(userData) {
    try {
      await validatePostSchema(userData);

      const coercedUserData = coerceUserData(userData);
      await validateUniqueUsername(coercedUserData.username);
      await validateUniqueEmail(coercedUserData.email);
      const newUser = await queryDatabase(coercedUserData);
      return newUser;
    } catch (error) {
      throw error;
    }

    async function queryDatabase(data) {
      const { username, email, password } = data;

      const query = {
        text: 'INSERT INTO users (username, email, password) VALUES($1, $2, $3) RETURNING *;',
        values: [username, email, password],
      };
      const results = await database.query(query);
      return results.rows[0];
    }
  }

  async function updateUser(id, data) {
    const { name, email, password } = data;
    try {
      const query = database.query(
        "UPDATE users SET name = $1, email = $2, password  = $3, updated_at = timezone('utc'::text, now()) WHERE id = $4 ",
        [name, email, password, id]
      );
      return (await query).rows;
    } catch (error) {
      throw error;
    }
  }

  async function deleteUser(id) {
    try {
      const query = database.query('DELETE FROM public.users WHERE id= $1', [id]);
      return (await query).rowCount;
    } catch (error) {
      throw error;
    }
  }

  async function validatePostSchema(userData) {
    const schema = Joi.object({
      username: Joi.string().alphanum().min(3).max(30).required().messages({
        'any.required': `"username" é um campo obrigatório.`,
        'string.empty': `"username" não pode estar em branco.`,
        'string.base': `"username" deve ser do tipo String.`,
        'string.alphanum': `"username" deve conter apenas caracteres alfanuméricos.`,
        'string.min': `"username" deve conter no mínimo {#limit} caracteres.`,
        'string.max': `"username" deve conter no máximo {#limit} caracteres.`,
      }),
      email: Joi.string().email().min(7).max(254).required().messages({
        'any.required': `"email" é um campo obrigatório.`,
        'string.empty': `"email" não pode estar em branco.`,
        'string.base': `"email" deve ser do tipo String.`,
        'string.email': `"email" deve conter um email válido.`,
      }),
      password: Joi.string().min(8).max(72).required().messages({
        'any.required': `"password" é um campo obrigatório.`,
        'string.empty': `"password" não pode estar em branco.`,
        'string.base': `"password" deve ser do tipo String.`,
        'string.min': `"password" deve conter no mínimo {#limit} caracteres.`,
        'string.max': `"password" deve conter no máximo {#limit} caracteres.`,
      }),
    });

    const { error } = schema.validate(userData);
    if (error) {
      throw new ValidationError({ message: error.details[0].message, stack: new Error().stack });
    }
  }

  async function validateUniqueUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE LOWER(username) = LOWER($1)',
      values: [username],
    };

    const results = await database.query(query);

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: `O username "${username}" já está sendo usado.`,
        stack: new Error().stack,
      });
    }
  }

  async function validateUniqueEmail(email) {
    const query = {
      text: 'SELECT email FROM users WHERE LOWER(email) = LOWER($1)',
      values: [email],
    };

    const results = await database.query(query);

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: `O email "${email}" já está sendo usado.`,
        stack: new Error().stack,
      });
    }
  }

  function coerceUserData(userData) {
    const coercedUserData = userData;

    if (coercedUserData.email) {
      coercedUserData.email = userData.email.toString().toLowerCase();
    }

    return coercedUserData;
  }

  return {
    create,
    findAll,
    findOneByUsername,
    updateUser,
    deleteUser,
  };
}
