const lsh = require('lodash');
const fs = require( 'fs' );

function splitArray(flatArray, numCols){
  var maxColLength = Math.ceil(flatArray.length/numCols);
  var nestedArray = lsh.chunk(flatArray, maxColLength);
  for (var i = nestedArray.length; i < numCols; i++) {
    nestedArray.push([]);
  }
  console.info('split array: ',nestedArray);
  savelog('[util]: ',JSON.stringify( nestedArray));
  return nestedArray;
}

function isSpecFile(url, matcher) {
  return (
    url.indexOf('/bower_components/') === -1 &&
    url.indexOf('/node_modules/') === -1 &&
    matcher.test(url)
  );
}

var stream = fs.createWriteStream( 'log-file.txt' );
var page='frameword';
function savelog( path, info )
{

  fs.appendFile( 'log-file.txt', `${new Date().toTimeString()}:${page} ${path} : ${info} \n`, error =>
  {
    //error
  } );
}
function setPage(origin){
  page=origin;
}
module.exports = { isSpecFile, splitArray,savelog,setPage };
