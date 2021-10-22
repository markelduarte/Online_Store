
//mongod.exe --dbpath C:\data\db\
//./mongod --dbpath /Users/mk/Downloads/database

var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var app = express();

// configuração do express para todas as views dentro do diretorio views
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// Schema Produto
var esquemaProduto = new mongoose.Schema({
    nome: String,
    descricao: String,
    preco: Number
});

var Produtos = mongoose.model('produtos', esquemaProduto);
// Fim Schema Produto

// Schema Pedido e Itens
var esquemaItens = new mongoose.Schema({
    nome: String,
    preco: Number
});

var esquemaPedido = new mongoose.Schema({
    itens: [esquemaItens],
    total: Number
});

var Pedidos = mongoose.model('pedidos', esquemaPedido);
// Fim Schema Pedido e Itens

// Função responsavel por criar um item
function Item(nome, preco){
    this.nome = nome;
    this.preco = preco;
}

var db = mongoose.connect('mongodb://localhost/loja_virtual_db');

// Rotas do Cliente
app.get('/', function(request, response){

        response.render('index');
    });


app.get('/cliente', function(request, response){

    // Busca todos os produtos cadastrados

    Produtos.find({}, function(erro, produtosEncontrados){
        var params = {
            produtos: produtosEncontrados
        };
        response.render('cliente', params);
    });

});

app.post('/cria-pedido', function(request, response){
    var produtos = request.body.produtos;

    //Total de produtos selecionados
    var _total = 0.0;


    //Cria lista de itens atraves dos produtos selecionados
    var _itens = [];

    produtos.forEach(function(produto, index){
        var item = new Item(produto.nome, produto.preco);
        _itens.push(item);
        _total += produto.preco;
    });

    var pedido = new Pedidos({
        itens: _itens,
        total: _total
    });

    pedido.save(function(erro){
        if(erro){
            console.log('Erro ao tentar salvar pedido');
        }else{
            response.json({numeroPedido: pedido._id});
        }
    });

});

app.get('/consulta-pedido', function(request, response){
    var id_pedido = request.query.numero_pedido;

    Pedidos.findById(id_pedido, function(erro, pedidoEncontrado){
        if(erro){
            console.log('Erro na hora de consultar pedido');
        }else{
            var params = {
              pedido: pedidoEncontrado
            };
            console.log(pedidoEncontrado);
            response.render('consulta', params);
        }
    });
});

app.get('/admin/pedidos-cadastrados', function(request, response){
    Pedidos.find({}, function(erro, pedidosEncontrados){
        if(erro){
            console.log('Erro ao buscar pedidos cadastrados');
        }else{
            var params = {
                pedidos: pedidosEncontrados
            };
            response.render('pedidos', params);
        }
    });
});

// Rotas do Administrador
app.post('/admin/cadastro', function(request, response){
    var body = request.body;

    var produto = new Produtos({
        nome: body.nome,
        descricao: body.descricao,
        preco: body.preco  
    });

    produto.save(function(erro){
        if(erro){
            console.log('Deu erro na aplicação');
        }else{
            response.redirect('/admin/produtos-cadastrados');
        }
    });
    
});

app.get('/admin/produtos-cadastrados', function(request, response){

    var params = {
        produtos: [],
    };

    Produtos.find({}, function(erro, produtosEncontrados){
        if(erro){
            console.log('Erro ao buscar produtos cadastrados')
        }else{
            params.produtos = produtosEncontrados;
            response.render('produtos', params);
        }
    });

});

app.get('/admin/remove-pedido/:id', function(request, response) {
    var id = request.params.id;

    Pedidos.findById(id, function(erro, pedidoEncontrado){
        if(erro){
            console.log('Erro ao tentar remover pedido');
        }else{
            pedidoEncontrado.remove();
            response.redirect('/admin/pedidos-cadastrados');
        }
    });

});


app.get('/admin/remove/:id', function(request, response) {
    var id = request.params.id;

    Produtos.findById(id, function(erro, produtoEncontrado){
        if(erro){
            console.log('Erro ao tentar remover produto');
        }else{
            produtoEncontrado.remove();
            response.redirect('/admin/pedidos-cadastrados');
        }
    });

});

app.listen(3000, function(){
    console.log('Servidor Rodando ...');
});