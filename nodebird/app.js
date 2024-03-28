const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');
const helmet = require('helmet');
const hpp = require('hpp');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);



dotenv.config();
// REDIS 관련 설정
const redisClient = redis.createClient({
    //url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    url:`redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD,
    legacyMode: true
});
redisClient.on('connect', () => {
    console.info('Redis connected!');
 });
 redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
 });
 redisClient.connect().then(); // redis v4 연결 (비동기)
 const redisCli = redisClient.v4; // 기본 redisClient 객체는 콜백기반인데 v4버젼은 프로미스 기반이라 사용
 
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models');  // models/index.js 에서 export한 db 객체에서 sequelize를 가져온다
const passportConfig = require('./passport');
const logger = require('./logger');

const app = express();
passportConfig();
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express : app,
    watch : true
});

sequelize.sync({ force: false })
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });

if(process.env.NODE_ENV == "production") {
    app.use(morgan('combined'));
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(hpp());
} else {
    app.use(morgan('dev'));
}
app.use(express.static(path.join(__dirname ,'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended : false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
const sessionOption = {
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false
    },
    store: new RedisStore({ client: redisClient, prefix: 'session:' })
}
if(process.env.NODE_ENV == "production") {
    sessionOption.proxy = true;
}
app.use(session(sessionOption));
app.use(passport.initialize());
 // 여기서 매 요청시 마다 ./passport/index.js 의 deserializeUser 를 호출한다.(세션에 저장한 아이디를 통해 사용자 정보 객체를 불러옴)
app.use(passport.session());
app.use('/', pageRouter);   
app.use('/auth', authRouter);
app.use('/post', postRouter);
app.use('/user', userRouter);


app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    logger.info('hello');
    logger.error(error.message);
    next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV === 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

// app.listen(app.get('port'), () => {
//     console.log(`${app.get('port')}번으로 리슨중`);
// });

module.exports = app;