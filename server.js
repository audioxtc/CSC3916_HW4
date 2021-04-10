/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Actor = require('./Actors');
var Review = require('./Reviews');
const mongoose = require("mongoose");


var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function (err) {
            if (err) {
                if (err.code == 11000)
                    return res.json({success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({username: userNew.username}).select('name username password').exec(function (err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function (isMatch) {
            if (isMatch) {
                var userToken = {id: user.id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            } else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

//implement movie route
router.route('/movies')
    .get(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        if (req.query.reviews){
            Movie.aggregate([
                {$match: {title: req.params.title}},
                {
                    $lookup: {
                        "from": "reviews",
                        "localField": "title",
                        "foreignField": "movietitle",
                        "as": "moviereviews"
                    }
                },
                {$group:
                        {_id: '$title',
                    avgReview: {$avg: "$rating"}
                }},
                {$sort: { avgReview: 5 }}

            ]).exec(function (err, moviereviews) {
                console.log(moviereviews.length)
                console.log(JSON.stringify(moviereviews));
                if (err) {
                    return res.status(400).json(err)
                }
                if (!moviereviews) {
                    return res.status(400).json({msg: "movie not found"})
                } else {

                    return res.status(200).json(moviereviews[0])
                }
            })
        }
    else {
        Movie.find({}, function (err, movies) {
        if (err) {
            res.status(405).send(err);
            console.log(movies);
        } else {
            //var o = getJSONObjectForMovieRequirement(req);
            res = res.status(200).json({msg: [movies]});
        }
        });
    }
})
    .put(authJwtController.isAuthenticated,
    function (req, res) {
        const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western'];
        Movie.findOne({title: req.body.title}, function (err, movie) {
            console.log(movie);
            if (err) {
                res.status(405).send(err);
            } else {
                if (req.body.year) {
                    movie.year = req.body.year;
                }
                if (req.body.genre) {
                    if (!genres.includes(req.body.genre)) {
                        movie.genre = req.body.genre;
                    }
                }
                if (req.body.leadactors) {
                    for (let i = 0; i < req.body.leadactors.length; i++) {
                        movie.leadActors[i].actorName = req.body.leadactors[i].actorName;
                        movie.leadActors[i].characterName = req.body.leadactors[i].characterName;
                    }
                }
                console.log(movie);
                movie.save(function (err) {
                    if (err) {
                        res.status(405).send(err);
                    } else {
                        console.log(movie);
                        var o = getJSONObjectForMovieRequirement(req);
                        res = res.status(200);
                        o.body = {msg: "movie updated."}
                        res.json(o);
                    }
                });
            }
        });
    }).delete(authJwtController.isAuthenticated, function (req, res) {
    if (req.body.title) {
        Movie.findOneAndDelete({title: req.body.title}, function (err, docs) {
            if (err) {
                res.status(405).send(err);
                console.log(err, docs);
                return res.json(err);
            }
            if (docs === null) {
                res = res.status(401);
                return res.json("Movie not found.");
            } else {
                res = res.status(200);
                console.log(docs);
                var o = getJSONObjectForMovieRequirement(req);
                o.body = {msg: "movie deleted."}
                res.json(o);
            }
        });
    }
    if (req.body.id) {
        console.log("got to id");

        Movie.find({_id: req.body.id}), function (err, docs) {
            if (err) {
                res.status(405).send(err);
                console.log(err);
                return res.json(err);
            } else {
                res = res.status(200);
                console.log("Movie deleted successfully:", docs);
                var o = getJSONObjectForMovieRequirement(req);
                o.body = {msg: "movie deleted."}
                res.json(o);
            }
        }
    }
}).post(authJwtController.isAuthenticated, function (req, res) {
    console.log(req.body);
    var movie = new Movie();
    movie.leadActors = req.body.leadactors;
    movie.title = req.body.title;
    movie.year = req.body.year;
    movie.genre = req.body.genre;
    //movie.id = req.body.movieid;
    movie.save(function (err) {
        if (err) {
            res.status(405).send(err);
            console.log(err);
        } else {
            var o = getJSONObjectForMovieRequirement(req);
            res = res.status(200);
            o.body = {msg: "movie saved."};
            res.json(o);
        }
    });
    //console.log('Movie saved.');
});

/*
router.get('/movies/:movieId', authJwtController.isAuthenticated, function (req, res) {
    //let movieID = req.params.movieID
    console.log(req.body);
    //var movie = new Movie();
    Movie.findById(req.params.movieId, function (err, movie) {
        if (err) {
            res.status(405).send(err);
            console.log(err);
        } else {
            return res.status(200).json(movie)
        }
    })

});
*/

router.put('/movies/Id', authJwtController.isAuthenticated, function (req, res) {
    Movie.findById(req.body.id, function (err, movie) {
        if (err) {
            console.log(err)
            res.status(405).send(err);
        } else {

            if (req.body.title) {
                movie.title = req.body.title
            }
            if (req.body.year) {
                movie.year = req.body.year;
            }
            if (req.body.genre) {
                movie.genre = req.body.genre;
            }
            if (req.body.leadactors) {
                for (let i = 0; i < req.body.leadactors.length; i++) {
                    movie.leadActors[i].actorName = req.body.leadactors[i].actorName;
                    movie.leadActors[i].characterName = req.body.leadactors[i].characterName;
                }
            }
            if (req.body.imageUrl) {
                movie.imageUrl = req.body.imageUrl;
            }
            movie.save(function (err) {
                if (err)
                    return res.status(404).json("error saving updated movie.");
                else {
                    return res.status(200).json("movie updated.");
                }
            })
        }
    });
});

router.route('/reviews')
    .post(authJwtController.isAuthenticated, function (req, res) {
        if (req.body.movietitle) {
            var review = new Review();
            review.rating = req.body.rating;
            review.quote = req.body.quote;
            review.movietitle = req.body.movietitle;
            review.reviewer = req.user.username;
            console.log(User.username)
            review.save(function (err) {
                if (err) {
                    console.log(err)
                    return res.status(400).send(err)
                } else {
                    return res.status(200).json("Review saved.")
                }
            })
        } else {
            return res.status(405).json("Must send movie title to add a review.")
        }
    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        Review.find({}, function (err, reviews) {
            if (err) {
                return res.status(400).send(err)
            } else {
                return res.status(200).json([reviews])
            }
        });
    });


//first get both collections
router.get('/movies/:title', authJwtController.isAuthenticated, function (req, res) {
    if (req.query.reviews) {
        Movie.aggregate([
            {$match: {title: req.params.title}},
            {
                $lookup: {
                    "from": "reviews",
                    "localField": "title",
                    "foreignField": "movietitle",
                    "as": "moviereviews"
                }
            }
        ]).exec(function (err, moviereviews) {
            console.log(moviereviews.length)
            console.log(JSON.stringify(moviereviews));
            if (err) {
                return res.status(400).json(err)
            }
            if (!moviereviews) {
                return res.status(400).json({msg: "movie not found"})
            } else {
                return res.status(200).json(moviereviews[0])
            }
        })
    }
});

/*
{
$lookup:
{
from: <collection to join>,
localField: <field from the input documents>,
foreignField: <field from the documents of the "from" collection>,
as: <output array field>
}
}

Movie.aggregate
db.orders.aggregate([
{
$lookup:
{
 from: "inventory",
 localField: "item",
 foreignField: "sku",
 as: "inventory_docs"
}
}
])

{
"_id" : 1,
"item" : "almonds",
"price" : 12,
"quantity" : 2,
"inventory_docs" : [
{ "_id" : 1, "sku" : "almonds", "description" : "product 1", "instock" : 120 }
]
}
{
"_id" : 2,
"item" : "pecans",
"price" : 20,
"quantity" : 1,
"inventory_docs" : [
{ "_id" : 4, "sku" : "pecans", "description" : "product 4", "instock" : 70 }
]
}
{
"_id" : 3,
"inventory_docs" : [
{ "_id" : 5, "sku" : null, "description" : "Incomplete" },
{ "_id" : 6 }
]
}
need .exec to execute the command with mongo
use $match to match the query
db.articles.aggregate(
[ { $match : { author : "dave" } } ]
);
use $avg call to average the reviews
*/

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


