/*
  MEAN Tutorial
  from https://thinkster.io/mean-stack-tutorial
*/

'use strict';

var app = angular.module('flapperNews', []);

app.controller('MainCtrl', ['$scope', function($scope) {
  $scope.test = 'Hello world!';

  $scope.posts = [
    'post 1',
    'post 2',
    'post 3',
    'post 4',
    'post 5'
  ];

}]);
