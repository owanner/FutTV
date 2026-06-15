const fifaApi =
 require("./services/fifaApi");

async function test(){

 const matches =
   await fifaApi.getMatches();

 console.log(
   "Jogos encontrados:",
   matches.length
 );

 console.log(
   matches[0]
 );

}

test();