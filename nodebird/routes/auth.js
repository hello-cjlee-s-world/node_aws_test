const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// 회원가입
router.post('/join', isNotLoggedIn, async (req, res, next) => {
    const { email, nick, password } = req.body;
    console.log(email, nick, password);
    try {
        const exUser = await User.findOne({where : {email}});
        // 들어온 이메일값으로 사용자가 존재할 경우 에러 반환
        if (exUser) {
            return res.redirect('/join?error=exist');
        }
        // 비밀번호 암호화
        const hash = await bcrypt.hash(password, 12);
        // 유저 생성
        await User.create({
            email,
            nick,
            password: hash
        });
        // 메인 페이지로 이동
        return res.redirect('/');
    } catch (error) {
        console.error(error);
        // 에러 페이지로 이동
        return next(error);
    }
});

// 로그인
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => { // local 로그인 전략 수행
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            return res.redirect(`/?loginError=${info.message}`);
        }
        return req.login(user, (loginError) => {
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next) 를 붙인다.
});

// 로그아웃
router.get('/logout', isLoggedIn, (req, res) => {
    // 업데이트로 비동기 함수가 되어 책하고 다르게 작성 책에는 req.logout(); 이라고 되어 있었음
    req.logout((err) => {
        if(err) { 
            return next(err); 
        }
    req.session.destroy();
    res.redirect('/');
    });
});

// 카카오 로그인
router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/')
});

module.exports = router;