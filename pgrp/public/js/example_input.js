
var examples = {
  healthcare: [
    'O que e HIV?',
    'Quais os beneficios de ingerir aspirinas diariamente?',
    'O que posso fazer para obter mais calcio?',
    'Como posso parar de fumar?',
    'Quem tem mais chances de ter diabetes?',
    'Sou propenso a ter pressao alta?'
  ],

  travel: [
    'Preciso de visto para entrar no Brasil?',
    'Quanto devo dar de gorjeta por uma corrida de taxi na Argentina?',
    'Qual o melhor lugar para mergulhar na Australia?',
    'Qual a altura do Monte Everest?',
    'Qual a profundidade do Grand Canyon?',
    'Quando e a epoca de chuvas em Bangalore?'
  ]
};

function loadExample() {
  var corpus = $("#select").val();
  var index = Math.floor(Math.random() * examples[corpus].length);
  $('#questionText').val(examples[corpus][index]);
}

//fill and submit the form with a random example
function showExample(submit) {
  loadExample();
  if (submit)
    $('#mtForm').submit();
}

document.onload=($('#questionText').val() === '') ? loadExample() : '';