/*
  MEAN Tutorial
  from https://thinkster.io/mean-stack-tutorial
*/

'use strict';

var app = angular.module('flapperNews', []);

app.controller('MainCtrl', ['$scope', function($scope) {
  $scope.test = 'Hello world!';
}]);
