const fifaApi =
 require("./services/fifaApi");

async function run(){

 const stages =
   await fifaApi.getStages();

 console.log(
   "\nFases encontradas:\n"
 );

 stages.forEach(stage => {

   console.log(
     stage.IdStage,
     "-",
     stage.Name?.[0]?.Description
   );
 });

}

run();