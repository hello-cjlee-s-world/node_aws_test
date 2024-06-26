const Sequelize = require('sequelize');

module.exports = class Post extends Sequelize.Model {
    static init(sequelize){
        return super.init({
            content: {
                type: Sequelize.STRING(140),
                allowNull: false
            },
            img: {
                type: Sequelize.STRING(200),
                allowNull: true
            }
        }, {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Post',
            tableName: 'posts',
            paranoid: false, // true면 createdAt, updatedAt, deletedAt 컬럼생성된다.
            charset: 'utf8',
            collate: 'utf8_general_ci'
        });
    }
    static associate(db) {
        db.Post.belongsTo(db.User);
        db.Post.belongsToMany(db.Hashtag, {through: 'PostHashtag'});
    }
};
