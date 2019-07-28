'use strict';

// This file gets loaded into the executing browsers and overrides the `describe` functions

function initKarmaParallelizer ( root, karma )
{
    var origStart = karma.start;
    karma.start = function ()
    {
        console.log( 'Xxxxxxxxxxxxx' );
        origStart.call( this );
    };
}
console.log( 'call karma parallaizar' );
initKarmaParallelizer(
    window,
    window.__karma__
);