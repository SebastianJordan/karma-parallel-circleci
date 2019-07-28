const _ = require( 'lodash' );

const { isSpecFile, splitArray,savelog } = require( './utils' );


function getMainConfig( fullConfig, log )
{
  savelog( '[getMainConfig]', 'init' );
  var config = fullConfig.sharding;

  config = typeof config === 'object' ? config : fullConfig.sharding = {};
  config.specMatcher = config.specMatcher ? config.specMatcher : /(spec|test)s?\.js/i;
  config.base = config.base ? config.base : '/base';
  config.sets = [];
  config.indexMap = {};
  config.getSets = config.getSets ? config.getSets : getSets;
  savelog( '[getMainConfig] config: ', JSON.stringify( config ) );
  return config;
}

function setupMiddleware( fullConfig )
{
  // ensure we load our middleware before karma's middleware for sharding
  savelog( '[setupMiddleware]', 'init' );
  fullConfig.beforeMiddleware = fullConfig.beforeMiddleware ? fullConfig.beforeMiddleware : [];
  if ( fullConfig.beforeMiddleware.indexOf( 'parallel-ci' ) === -1 )
  {
    fullConfig.beforeMiddleware.unshift( 'parallel-ci' );
  }
}

function setupCoverageReporting( fullConfig )
{
  // ensure that the coverage reporter aggregates coverage reporting based on browser.name
  savelog( '[setupCoverageReporting]', 'init' );
  fullConfig.coverageReporter = fullConfig.coverageReporter ? fullConfig.coverageReporter : {};
  fullConfig.coverageReporter.browserId = 'name';
  savelog( '[setupCoverageReporting] value', JSON.stringify(fullConfig.coverageReporter ));
}

function setupSets( config, basePath, files, log )
{
  config.sets = config.getSets( config, basePath, files, log );
  config.performSharding = _.last( config.sets ).length;
  savelog( '[setupSets] basePath: ', basePath );
}

// // can be redefined in sharding config
function getSets( config, basePath, files, log )
{
  savelog( '[getSets]', 'init' );
  // console.log( 'config: ', config );
  // console.log( 'path: ', basePath );
  // savelog('files: ',files);
  var specs = files.served.map( f => config.base + f.path.replace( basePath, '' ) )
    .filter( p => isSpecFile( p, config.specMatcher ) );
  return splitArray( specs, config.browserCount );
}

function setupSharding( config, fullConfig, log )
{
  if ( !config.performSharding )
  {
    fullConfig.coverageReporter.browserId = 'id'; // reset coverage back to their default
    fullConfig.browsers = fullConfig.browsers.filter( function( item, pos, arr )
    {
      return arr.indexOf( item ) === pos;
    } );
  }
  log.debug( 'reduced browser set to:', fullConfig.browsers );
}

function setBrowserCount( config, browsers, log )
{
  savelog( '[setBrowserCount]', 'init' );
  config.browserCount = browsers.length;
  // savelog( 'sharding specs across', config.browserCount, config.browserCount === 1 ? 'browser' : 'browsers' );
}

function handleFileListModified( fullConfig, config, files, log )
{
  setupSets( config, fullConfig.basePath, files, log );
  setupSharding( config, fullConfig, log );
  // savelog( 'xxxconfig.sets:', config.performSharding  );
}

function handleBrowserRegister( config, browser, log )
{
  savelog( '[handleBrowserRegister] sets: ', config.sets.shift() );
  savelog( '[handleBrowserRegister] browser.id: ', browser.id );
  savelog('[handleBrowserRegister] config: ',  JSON.stringify(config)); 
  config.indexMap[ browser.id ] = config.sets.shift();
}

function generateEmitter( emitter, fullConfig, config, log )
{
  savelog( '[generateEmitte]', 'init' );
  const originalEmit = emitter.emit;
  emitter.emit = function( event, entry )
  {
    savelog( `-- event:`, event );
    switch ( event )
    {
      case 'file_list_modified':
        handleFileListModified( fullConfig, config, entry, log );
        //getSets( config, config.basePath, entry );
        // getSets( config, '/Users/sun/Documents/Project/karma-parallel-circleci', entry )
        config.getSets( config, '/Users/sun/Documents/Project/karma-parallel-circleci', entry, log );
        break;
      case 'browser_register':
        handleBrowserRegister( config, entry, log );
        break;
      case 'browsers_ready':
        savelog( 'kill proces' );
        break;
    }
    return originalEmit.apply( emitter, arguments );
  };
}

module.exports = function(/* config */fullConfig, emitter, logger )
{
  var log = logger.create( 'framework:parallel-ci' );
  savelog( '[main]', 'init' );
  var config = getMainConfig( fullConfig, log );
  setupMiddleware( fullConfig );
  setupCoverageReporting( fullConfig );
  config.browserCount = fullConfig.circleciParallel;
  savelog( '[main] config.max parallel: ', fullConfig.circleciParallel );
  // generateEmitter( emitter, fullConfig, config, log );
  const originalEmit = emitter.emit;
  var callbrowser=0;
  emitter.emit = function( event, entry )
  {
    savelog( `[main] -- event:`, event );
    switch ( event )
    {
      case 'file_list_modified':
        handleFileListModified( fullConfig, config, entry, log );
        //getSets( config, config.basePath, entry );
        // getSets( config, '/Users/sun/Documents/Project/karma-parallel-circleci', entry )
        config.getSets( config, config.basePath, entry, log );
        break;
      case 'browser_register':
        // entry es el browser
        callbrowser+=1;
        handleBrowserRegister( config, entry, log );
        // savelog( '[handleBrowserRegister]: ', config.sets.shift() );
        break;
      case 'browser_start':
        // savelog( 'kill proces' );
        savelog( '[main] starbroser: ', JSON.stringify( config) );
        savelog('[main] callbrwoser ',callbrowser);
        break;
    }
    return originalEmit.apply( emitter, arguments );
  };

};


