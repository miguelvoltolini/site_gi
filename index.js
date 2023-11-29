const express = require('express')
const bcrypt = require('bcrypt')
const app = express()
const exphbs = require('express-handlebars')
const conn = require('./db/conn')
const Usuario = require('./models/Usuario')
const Produto = require('./models/Produto')

//======= models

const PORT = 3000
const hostname = 'localhost'
let log = false
let adm = false
let nomeAdm = ''
let tipoUsuario = ''
let idUsuario = ''

//========================================= config express
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(express.static('public'))
//========================================= config handlebars
app.engine('handlebars', exphbs.engine())
app.set('view engine', 'handlebars')
//=========================================


// ================== Produtos à venda =======================

app.post('/comprar', async (req, res) => {
    try {
        const dadosCarrinho = req.body;
        console.log('Dados do carrinho:', dadosCarrinho);

        const atualizacoesPromises = [];

        for (const item of dadosCarrinho) {
            const produto = await Produto.findByPk(item.cod_produto);

            if (!produto || produto.qtde_estoque < item.qtde) {
                return res.status(400).json({
                    message: `Produto insuficiente ou não disponível. Estoque atual: ${produto ? produto.qtde_estoque : 0}`,
                });
            }

            const atualizacaoPromessa = Produto.update(
                { qtde_estoque: produto.qtde_estoque - item.qtde },
                { where: { id: item.cod_produto } }
            );

            atualizacoesPromises.push(atualizacaoPromessa);
        }

        await Promise.all(atualizacoesPromises);

        res.status(200).json({ message: 'Compra realizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao processar a compra:', error);
        res.status(500).json({ message: 'Erro ao processar a compra' });
    }
});


//========================================= carrinho


app.get('/carrinho', (req,res)=>{
    res.render('carrinho', {log, idUsuario, nomeAdm, adm, tipoUsuario})
})

//=========================================apagar produto

app.post('/apagar_produto', async (req,res)=>{
    const nome_produto = req.body.nome_produto
    const cod_produto = req.body.cod_produto
    const qtde_estoque = req.body.qtde_estoque
    const cor = req.body.cor
    const tamanho = req.body.tamanho
    const preco = req.body.preco

    const pesq = await Produto.findOne({raw:true, where:{ nome_produto:nome_produto, cod_produto:cod_produto, qtde_estoque:qtde_estoque, cor:cor, tamanho:tamanho, preco:preco}})

    let msg = 'Dados não encontrados'
    let msg2 = 'Produto Apagado!'
    log = true

    if(pesq==null){
        res.render('apagar_produto', {log, adm, nomeAdm, msg})
    }else{
        await Produto.destroy({where:{nome_produto:pesq.nome_produto, cod_produto:pesq.cod_produto, qtde_estoque:pesq.qtde_estoque, cor:pesq.cor, tamanho:pesq.tamanho, preco:pesq.preco}})
        res.render('apagar_produto', {log, adm, nomeAdm, msg2})
    }
})

app.get('/apagar_produto', (req,res)=>{
    res.render('apagar_produto', {log, adm, nomeAdm, tipoUsuario})
})
//=========================================atualizar produto
app.post('/atualizar_produto', async (req,res)=>{
    //config atuais
    const nome_produto = req.body.nome_produto
    const cod_produto = req.body.cod_produto
    const qtde_estoque = req.body.qtde_estoque
    const cor = req.body.cor
    const tamanho = req.body.tamanho
    const preco = req.body.preco
    //novas config
    const novo_id = req.body.novo_id
    const novo_nome_produto = req.body.novo_nome_produto
    const novo_cod_produto = req.body.novo_cod_produto
    const novo_qtde_estoque = req.body.novo_qtde_estoque
    const novo_cor = req.body.novo_cor
    const novo_tamanho = req.body.novo_tamanho
    const novo_preco = req.body.novo_preco

    const pesq = await Produto.findOne({raw:true, where:{ nome_produto:nome_produto, cod_produto:cod_produto, qtde_estoque:qtde_estoque, cor:cor, tamanho:tamanho, preco:preco}})

    const dados = {
        nome_produto: novo_nome_produto,
        cod_produto: novo_cod_produto,
        qtde_estoque: novo_qtde_estoque,
        cor: novo_cor,
        tamanho: novo_tamanho,
        preco: novo_preco,
    }

    let msg = 'Dados não encontrados'
    let msg2 = 'Produto Atualizado!'
    log = true

    if(pesq==null){
        res.render('atualizar_produto', {log, adm, nomeAdm, msg})
    }else{
        await Produto.update(dados, {where:{nome_produto:pesq.nome_produto, cod_produto:pesq.cod_produto, qtde_estoque:pesq.qtde_estoque, cor:pesq.cor, tamanho:pesq.tamanho, preco:pesq.preco}})
        res.render('atualizar_produto', {log, adm, nomeAdm, msg2})
    }
})

app.get('/atualizar_produto', (req,res)=>{
    res.render('atualizar_produto', {log, adm, nomeAdm, tipoUsuario})
})

//=========================================listar usuario
app.get('/login', async (req, res)=>{
    const pesq = await Usuario.findByPk(idUsuario, {raw:true})
    console.log(pesq)
    res.render('login', {log, valores:pesq, tipoUsuario, adm, nomeAdm, tipoUsuario})
})

//=========================================listar produto

app.get('/listar_produto', async (req,res)=>{
    const pesq = await Produto.findAll({raw:true})
    res.render('listar_produto', {log, adm, valores:pesq})
})

//=========================================cadastrar 

app.get('/cadastrar_usuario', (req,res)=>{
    res.render('cadastrar_usuario', {log, nomeAdm, adm, tipoUsuario})
})

app.post('/cadastrar_produto', async (req,res)=>{
    const nome_produto = req.body.nome_produto
    const cod_produto = req.body.cod_produto
    const qtde_estoque = req.body.qtde_estoque
    const cor = req.body.cor
    const tamanho = req.body.tamanho
    const preco = req.body.preco
    await Produto.create({nome_produto:nome_produto, cod_produto:cod_produto, 
    qtde_estoque:qtde_estoque, cor:cor, tamanho:tamanho, preco:preco})

    let msg = 'Produto cadastrado!'
    res.render('cadastrar_produto', {log, adm, msg})
})

app.get('/cadastrar_produto', (req,res)=>{
    res.render('cadastrar_produto', {log, adm})
})

//=========================================cadastro de adm com bcrypt

app.post('/cadastrar_adm', async (req, res)=>{
    const nome = req.body.nome
    const sobrenome = req.body.sobrenome
    const cpf = req.body.cpf
    const telefone = req.body.telefone
    const email = req.body.email
    const senha = req.body.senha

    bcrypt.hash(senha, 10, async (err, hash)=>{
        if(err){
            console.error('Erro ao criar o hash da senha: ' + err)
            msg = 'Erro ao cadastrar a senha. Tente novamente.'
            res.render('cadastrar_adm', {log, msg, idUsuario, nomeAdm, tipoUsuario, adm})
            return
        }
        try{
            await Usuario.create({nome:nome, sobrenome:sobrenome, cpf:cpf, telefone:telefone, email:email, senha:hash, tipo:'adm'})
            console.log('Senha criptografada')
            
            const pesq = await Usuario.findOne({raw:true, where:{nome:nome, senha:hash}})
            console.log(pesq)
            
            log = true
            msg = 'Usuário cadastrado'
            
            res.render('cadastrar_adm', {log, msg, idUsuario, tipoUsuario, adm})
        }catch(error){
            console.error('Erro ao criar novo cadastro '+ error)
            msg = 'Erro ao criar novo cadastro. Tente novamente.'
            res.render('cadastrar_adm', {log, msg, idUsuario, tipoUsuario, adm})
        }
    })
})

app.get('/cadastrar_adm', (req,res)=>{
    log = true
    adm = true
    res.render('cadastrar_adm', {log, adm, tipoUsuario})
})

//=========================================cadastro de cliente com bcrypt
app.post('/cadastrar_usuario', async (req, res)=>{
    const nome = req.body.nome
    const sobrenome = req.body.sobrenome
    const cpf = req.body.cpf
    const telefone = req.body.telefone
    const email = req.body.email
    const senha = req.body.senha

    bcrypt.hash(senha, 10, async (err, hash)=>{
        if(err){
            console.error('Erro ao criar o hash da senha: ' + err)
            msg = 'Erro ao cadastrar sua senha. Tente novamente.'
            res.render('login', {log, msg, idUsuario, nomeAdm, tipoUsuario, adm})
            return
        }
        try{
            await Usuario.create({nome:nome, sobrenome:sobrenome, cpf:cpf, telefone:telefone, email:email, senha:hash, tipo:'cliente'})
            console.log('Senha criptografada')
            
            const pesq = await Usuario.findOne({raw:true, where:{nome:nome, senha:hash}})
            console.log(pesq)
            
            log = true
            msg = 'Usuário cadastrado'
            
            res.render('home', {log, msg, idUsuario, tipoUsuario, adm})
        }catch(error){
            console.error('Erro ao criar novo cadastro '+ error)
            msg = 'Erro ao criar novo cadastro. Tente novamente.'
            res.render('login', {log, msg, idUsuario, tipoUsuario, adm})
        }
    })
})


//========================================= Login
app.post('/login', async (req,res)=>{
    const email = req.body.email
    const senha = req.body.senha
    const pesq = await Usuario.findOne({raw:true, where:{email:email}})

    if(pesq == null){
        msg = 'Usuário não cadastrado'
        res.render('login', {log, msg})
    }else{
        // comparando a senha com o uso de hash
        bcrypt.compare(senha, pesq.senha, (err,compativel)=>{
            if(err){
                console.error('Erro ao comparar a senha',err)
                msg = 'Erro, por favor tente novamente'
                res.render('login', {log, msg})
            }else if(compativel){
                if(pesq.tipo === 'adm'){
                    log = true
                    adm = true
                    nomeAdm = pesq.nome
                    idUsuario = Number(pesq.id)
                    tipoUsuario = pesq.tipo
                    res.render('sistema', {log, nomeAdm, tipoUsuario, adm, idUsuario})        
                }else if(pesq.tipo === 'cliente'){
                    log = true
                    idUsuario =  Number(pesq.id)
                    tipoUsuario = pesq.tipo
                    res.render('login', {log, tipoUsuario, adm, idUsuario})
                }else{
                    idUsuario =  Number(pesq.id)
                    res.render('login', {log, tipoUsuario, adm, idUsuario})
                }
            }else{
                msg = 'Senha incorreta'
                res.render('login', {log, msg})
            }
        })
    }
})
app.get('/login', (req,res)=>{
    res.render('login', {log, idUsuario, nomeAdm, adm, tipoUsuario})
})


//========================================= Home

app.get('/logout', (req,res)=>{
    adm = false
    log = false
    res.render('login', {log, adm, nomeAdm})
})

app.get('/sistema', (req,res)=>{
    res.render('sistema', {log, adm, nomeAdm, tipoUsuario})
})

app.get('/home', (req,res)=>{
    res.render('home', {log, adm, tipoUsuario})
})

app.get('/', (req,res)=>{
    res.render('home', {log, adm, tipoUsuario})
})

//=========================================

conn.sync().then(()=>{
    app.listen(PORT, hostname, ()=>{
        console.log(`Servidor rodando em ${hostname}:${PORT}`)
    })
}).catch((error)=>{
    console.error('Erro de conexão'+ error)
})