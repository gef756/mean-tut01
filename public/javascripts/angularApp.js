/*
  Walkthrough of MEAN Tutorial
  from https://thinkster.io/mean-stack-tutorial
  GEF
*/

'use strict';

var app = angular.module('flapperNews', ['ui.router']);

app.config([
  '$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl',
        resolve: {
          postPromise: ['posts', function(posts) {
            return posts.getAll();
          }]
        }
      })
      .state('posts', {
        url: '/posts/{id}',
        templateUrl: '/posts.html',
        controller: 'PostsCtrl',
        resolve: {
          post: ['$stateParams', 'posts', function($stateParams, posts) {
            return posts.get($stateParams.id);
          }]
        }
      })
      .state('login', {
        url: '/login',
        templateUrl: '/login.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth) {
          // check if user is already logged in, and if so, redirect to home
          if (auth.isLoggedIn()) {
            $state.go('home');
          }
        }]
      })
      .state('register', {
        url: '/register',
        templateUrl: '/register.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth) {
          // check if user is already logged in, and if so, redirect to home
          if (auth.isLoggedIn()) {
            $state.go('home');
          }
        }]
      });
    $urlRouterProvider.otherwise('home');
  }
]);

app.factory('posts', ['$http', 'auth', function($http, auth) {
  var o = {
    posts: [
      {title: 'post 1', upvotes: 5},
      {title: 'post 2', upvotes: 2},
      {title: 'post 3', upvotes: 15},
      {title: 'post 4', upvotes: 9},
      {title: 'post 5', upvotes: 4}
    ]
  };

  o.getAll = function() {
    return $http.get('/posts').success(function(data) {
      angular.copy(data, o.posts);
    });
  };

  o.create = function(post) {
    return $http
      .post('/posts', post, {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      })
      .success(function(data) {
        o.posts.push(data);
    });
  };

  o.upvote = function(post) {
    return $http
      .put('/posts/' + post._id + '/upvote', null, {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      })
      .success(function(data) {
        post.upvotes++;
      });
  };

  o.downvote = function(post) {
    return $http
      .put('/posts/' + post._id + '/downvote', null, {
        headers: {Authorization: 'Bearer ' + auth.getToken()}
      })
      .success(function(data) {
        post.upvotes--;
      });
  };

  o.get = function(id) {
    return $http.get('/posts/' + id).then(function(res) {
      return res.data;
    });
  };

  o.addComment = function(id, comment) {
    return $http.post('/posts/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    });
  };

  o.upvoteComment = function(post, comment) {
    return $http
      .put('/posts/' + post._id + '/comments/' + comment._id + '/upvote',
        null, {headers: {Authorization: 'Bearer ' + auth.getToken()}})
      .success(function(data) {
        comment.upvotes++;
      });
  };

  o.downvoteComment = function(post, comment) {
    return $http
      .put('/posts/' + post._id + '/comments/' + comment._id + '/downvote',
        null, {headers: {Authorization: 'Bearer ' + auth.getToken()}})
      .success(function(data) {
        // Update vote count locally
        // We may want to consider using the newest vote count, but
        // that would cause some confusion from a UX perspective
        // as clicking the button could result in a (net) zero impact
        // or even an impact in the opposite direction.
        comment.upvotes--;
      });
  };

  return o;
}]);

app.factory('auth', ['$http', '$window', function($http, $window) {
  var auth = {};

  auth.saveToken = function(token) {
    $window.localStorage['flapper-news-token'] = token;
  };

  auth.getToken = function() {
    return $window.localStorage['flapper-news-token'];
  };

  // Is the user logged in?
  auth.isLoggedIn = function() {
    var token = auth.getToken();
    if (token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  // Get name of user that is logged in
  auth.currentUser = function() {
    if (auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.username;
    }
  };

  auth.register = function(user) {
    return $http.post('/register', user).success(function(data) {
      auth.saveToken(data.token);
    });
  };

  auth.logIn = function(user) {
    return $http.post('/login', user).success(function(data) {
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function() {
    $window.localStorage.removeItem('flapper-news-token');
  }

  return auth;
}]);

app.controller('MainCtrl', ['$scope', 'posts', 'auth',
    function($scope, posts, auth) {
  $scope.posts = posts.posts;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.test = 'Hello world!';

  $scope.addPost = function() {
    if(!$scope.title || $scope.title === '') {
      return;
    }
    var newPost = {
      title: $scope.title,
      link: $scope.link,
      upvotes: 0
    };
    posts.create(newPost);
    // Reset input for next submission
    $scope.title = '';
    $scope.link = '';
  };

  $scope.incrementUpvotes = function(post) {
    posts.upvote(post);
  };

  $scope.decrementUpvotes = function(post) {
    posts.downvote(post);
  };

}]);

app.controller('PostsCtrl', [
  '$scope', 'posts', 'post', 'auth',
  function($scope, posts, post, auth) {
    $scope.post = post;
    $scope.isLoggedIn = auth.isLoggedIn;

    $scope.addComment = function() {
      // Don't add if comment is empty
      if ($scope.body === '') {
        return;
      }
      // Submit comment to server
      posts
        .addComment(post._id, {
          body: $scope.body
        })
        .success(function(comment) {
          $scope.post.comments.push(comment);
        });
      // Clear input after submission
      $scope.body = '';
    };

    $scope.incrementUpvotes = function(comment) {
      posts.upvoteComment(post, comment);
    };

    $scope.decrementUpvotes = function(comment) {
      posts.downvoteComment(post, comment);
    };
  }
]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth',
  function($scope, $state, auth) {
    $scope.user = {};

    $scope.register = function() {
      auth
        .register($scope.user)
        .error(function(error) {
          $scope.error = error;
        })
        .then(function() {
          $state.go('home');
        });
    };

    $scope.logIn = function() {
      auth
        .logIn($scope.user)
        .error(function(error) {
          $scope.error = error;
        })
        .then(function() {
          $state.go('home');
        });
    };
  }
]);

app.controller('NavCtrl', ['$scope', 'auth', function($scope, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);
