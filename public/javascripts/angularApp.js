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
        controller: 'PostsCtrl'
      });
    $urlRouterProvider.otherwise('home');
  }
]);

app.factory('posts', ['$http', function($http) {
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
      .post('/posts', post)
      .success(function(data) {
        o.posts.push(data);
    });
  };

  o.upvote = function(post) {
    return $http
      .put('/posts/' + post._id + '/upvote')
      .success(function(data) {
        post.upvotes++;
      });
  };

  return o;
}]);

app.controller('MainCtrl', ['$scope', 'posts',
    function($scope, posts) {
  $scope.posts = posts.posts;
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

}]);

app.controller('PostsCtrl', [
  '$scope', '$stateParams', 'posts', function($scope, $stateParams, posts) {
    $scope.post = posts.posts[$stateParams.id];

    $scope.addComment = function() {
      // Don't add if comment is empty
      if ($scope.body === '') {
        return;
      }
      // Add comments property if it doesn't exist already
      if (!$scope.post.hasOwnProperty('comments')) {
        $scope.post.comments = [];
      }
      // Add comment to post
      $scope.post.comments.push({
        body: $scope.body,
        author: 'user',
        upvotes: 0
      });
      // Clear input after submission
      $scope.body = '';
    }
  }
])
