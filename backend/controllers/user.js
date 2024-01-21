const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NotFoundError = require('../errors/not-found-err');
const UnauthorizedError = require('../errors/unauthorized-err');
const BadRequestError = require('../errors/bad-request-err');
const InternalServerError = require('../errors/internal-server-err');
const ConflictError = require('../errors/conflict-err');
const { jwtSecret } = require('../utils');

const UserModel = require('../models/user');

const login = (req, res, next) => {
  const { email, password } = req.body;

  UserModel.findOne({ email })
    .select('+password')
    .then(async (user) => {
      const error = new UnauthorizedError('Неправильные почта или пароль');
      if (!user) {
        return next(error);
      }
      const matched = await bcrypt.compare(password, user.password);
      if (!matched) {
        return next(error);
      }
      const token = jwt.sign({ _id: user._id }, jwtSecret, {
        expiresIn: '1w',
      });

      return res.send({ token });
    })
    .catch((e) => {
      const err = new InternalServerError(e.message);
      return next(err);
    });
};

const getUsers = (req, res, next) => UserModel.find()
  .then((users) => res.send(users))
  .catch(() => {
    const err = new InternalServerError('Не удалось загрузить данные пользователя');
    return next(err);
  });

const getUser = (req, res, next) => UserModel.findById(req.user._id)
  .then((user) => res.send(user))
  .catch(() => {
    const err = new InternalServerError('Не удалось загрузить данные пользователя');
    return next(err);
  });

const getUserById = (req, res, next) => UserModel.findById(req.params.id)
  .orFail()
  .then((user) => res.send(user))
  .catch((e) => {
    let err;
    if (e.name === 'DocumentNotFoundError') {
      err = new NotFoundError('Пользователь не найден');
    } else if (e.name === 'CastError') {
      err = new BadRequestError('Неверный идентификатор пользователя');
    } else {
      err = new InternalServerError('Не удалось загрузить пользователя');
    }
    return next(err);
  });

const createUser = (req, res, next) => {
  const {
    email, name, about, avatar, password,
  } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) => UserModel.create({
      email, name, about, avatar, password: hash,
    }))
    .then(({ _doc }) => res.send({
      name: _doc.name,
      email: _doc.email,
      about: _doc.about,
      avatar: _doc.avatar,
    }))
    .catch((e) => {
      let err;
      if (e.name === 'ValidationError') {
        err = new BadRequestError('Ошибка валидации');
      } else if (e.code === 11000) {
        err = new ConflictError('Емейл уже занят');
      } else {
        err = new InternalServerError('Не удалось создать пользователя');
      }
      return next(err);
    });
};

const patchUser = (req, res, next) => {
  const { name, about } = req.body;
  const id = req.user._id;
  UserModel.findByIdAndUpdate(
    id,
    { name, about },
    { new: true, runValidators: true },
  )
    .orFail()
    .then((user) => res.send(user))
    .catch((e) => {
      let err;
      if (e.name === 'DocumentNotFoundError') {
        err = new NotFoundError('Пользователь не найден');
      } else if (e.name === 'ValidationError') {
        err = new BadRequestError(e.message);
      } else if (e.name === 'CastError') {
        err = new BadRequestError('Неверный идентификатор пользователя');
      } else {
        err = new InternalServerError('Не удалось обновить информацию о пользователе');
      }
      return next(err);
    });
};

const patchUserAvatar = (req, res, next) => {
  const { avatar } = req.body;
  const id = req.user._id;

  UserModel.findByIdAndUpdate(id, { avatar }, { new: true, runValidators: true })
    .orFail()
    .then((user) => res.send(user))
    .catch((e) => {
      let err;
      if (e.name === 'DocumentNotFoundError') {
        err = new NotFoundError('Пользователь не найден');
      } else if (e.name === 'ValidationError') {
        err = new BadRequestError(e.message);
      } else if (e.name === 'CastError') {
        err = new BadRequestError('Неверный идентификатор пользователя');
      } else {
        err = new InternalServerError('Не удалось обновить аватар пользователя');
      }
      return next(err);
    });
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  patchUser,
  patchUserAvatar,
  login,
  getUser,
};
