require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { errors } = require('celebrate');
const userRoutes = require('./routes/userRoutes');
const cardRoutes = require('./routes/cardRoutes');
const auth = require('./middlewares/auth');
const errorsHandler = require('./middlewares/errorHandler');
const { validateLogin, validateRegister } = require('./utils/validators/userValidator');
const { login, createUser } = require('./controllers/user');
const { errorLogger, requestLogger } = require('./middlewares/logger');
const cors = require('./middlewares/cors');
const NotFoundError = require('./utils/errors/notFoundError');

const { PORT = 3000 } = process.env;

const app = express();
app.use(bodyParser.json());
mongoose.connect('mongodb://localhost:27017/mestodb');
app.use(requestLogger);
app.use(cors);
app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});
app.post('/signin', validateLogin, login);
app.post('/signup', validateRegister, createUser);

app.use(auth);
app.use('/cards', cardRoutes);
app.use('/users', userRoutes);
app.use('*', () => {
  throw new NotFoundError('Запрашиваемый адрес не найден. Проверьте URL и метод запроса');
});
app.use(errorLogger);
app.use(errors());
app.use(errorsHandler);

app.listen(PORT, () => {
  console.log(`App listening at port ${PORT}`);
});
