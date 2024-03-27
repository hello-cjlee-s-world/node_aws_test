const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Quertytypes } = require('sequelize');
const { Post, User, Hashtag, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

const router = express.Router();

router.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.followerCount = req.user ? req.user.Followers.length : 0;
    res.locals.follwingCount = req.user ? req.user.Followings.length : 0;
    res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
    next();
});

router.get('/profile', isLoggedIn, async (req, res, next) => {
    try {
        let query = `SELECT followingId FROM follow WHERE followerId = ${req.user.id}`
        const followings = await sequelize.query(query, {
            type: QueryTypes.SELECT,
        });
        query = `SELECT followerId FROM follow WHERE followingId = ${req.user.id}`
        const followers = await sequelize.query(query, {
            type: QueryTypes.SELECT,
        });
        console.log(followings);
        console.log(followers);
        res.render('profile', {
            title : 'NodeBird - 내 정보',
            Followings : followings,
            Followers : followers
        });
    } catch (error) {
        console.error(error);
        next(error);
    }   
})

router.get('/join', isNotLoggedIn, (req, res) => {
    res.render('join', { title : '회원가입 - NodeBird' });
});

router.get('/', async (req, res, next) => {
    try {
        const posts = await Post.findAll({
            include: {
                model: User,
                attributes: ['id', 'nick']
            },
            order: [['createdAt', 'DESC']]
        });
        //console.log(posts);
        res.render('main', {
            title: 'NodeBird',
            twits: posts
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
})

router.get('/hashtag', async(req, res, next) => {
    const query = req.query.hashtag;
    if (!query) {
        return res.redirect('/');
    } 
    try {
        const hashtag = await Hashtag.findOne({ where: {title: query} });
        let posts = [];
        if (hashtag) {
            posts = await hashtag.getPosts({ include: [{ model: User }] });
        }

        return res.render('main', {
            title: `${query} | NodeBird`,
            twits: posts
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
})

module.exports = router;