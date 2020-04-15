const express = require('express')
const app = express()
const fs = require('fs')
const cors = require('cors')
const bodyParser = require('body-parser')
const caminho = __dirname+'./AnalisePopulacionalTratada.csv'

app.use(express.static('.'))
app.use(cors())
app.use(bodyParser.json())

function pegarLocais(results, analisePopulacional) {
    const cidades = []
    results.forEach(place => {
        if(place) {
            let cidade = {}
            analisePopulacional.forEach(obj => {
                let lugar = place.vicinity || ''
                let result = lugar.indexOf(obj.nome) > -1
                if(result) {
                    cidade.nome = obj.nome
                }else if(place.plus_code) {
                    lugar = place.plus_code.compound_code
                    result = lugar.indexOf(obj.nome) > -1
                    if(result) {
                        cidade.nome = obj.nome
                    }
                }
            })

            cidade.cobertura = place.cobertura
            cidade.custo = place.custo
            
            cidades.push(cidade)
        }
    })
    console.log(cidades)
    return cidades
}


app.get('/', (req, res) => {res.send('Teste')})

app.post('/construirJSON', (req, res, next) => {
    //Tratamento do arquivo
    const arquivo = fs.readFileSync(caminho, 'utf-8')
    const linhas = arquivo.split('\n')
    const analisePopulacional = linhas.map(linha => {
        dados = linha.split(',')
        return {id: dados[0], nome: dados[1]}
    }).filter(elemento => elemento.id != 'Posição' && elemento.id != '')

    //Tratar os hospitais/estados que recebi
    const {lugares, filtro} = req.body
    const locais = pegarLocais(lugares, analisePopulacional)
    novosLocais = locais.filter(lugar => lugar.nome.trim() != "")

    let i = 0
    console.log('Novas Cidades', novosLocais)
    const cover = {value: []}
    const city = {value: []}
    const cost = {value: []}
    novosLocais.forEach(local => {
        let cidade = analisePopulacional.find(cidade => cidade.nome == local.nome.trim())
        if(cidade == undefined){
            console.log('Deu ruim', string)
        } else {
            cover.value.push(local.cobertura)
            city.value.push(cidade.id)
            cost.value.push(local.custo)
        }
        //return {id: i++, cidade: cidade.id, nome: cidade.nome, cobertura: local.cobertura, custo: local.custo}
    })

    /*console.log('Novo CSV', novoCSV)

    let stringFinal = ''

    novoCSV.forEach(linha => {
        stringFinal += `${linha.id},${linha.cidade},${linha.cobertura},${linha.custo}\n`
    })*/

    //fs.writeFile(__dirname + `/ocorrenciaCidades.csv`, stringFinal, err => res.status(500).send(err))
    res.status(200).send(JSON.stringify({city, cover, cost}))
    //console.log(novoCSV)
    
    //res.send((cidades))*/
})


app.listen(3000, () => {
    console.log('Aplicação rodando')
})