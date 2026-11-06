const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/concepts', require('./routes/conceptRoutes'));
app.use('/api/dependencies', require('./routes/dependencyRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/users/me', require('./routes/progressRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
