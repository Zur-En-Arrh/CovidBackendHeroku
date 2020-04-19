const express = require('express')
const app = express()
const fs = require('fs')
const cors = require('cors')
const bodyParser = require('body-parser')
const axios = require('axios')
const geocodificacao = 'https://maps.googleapis.com/maps/api/geocode/json'

app.use(express.static('.'))
app.use(cors())
app.use(bodyParser.json())


async function ajax(lugar) {
    try{
        const resposta = await axios(geocodificacao, {
            params: {
                address: lugar.vicinity,
                key: 'AIzaSyBofqU_V-dLDeMwfha5K8RcYwxwABYD_tY'
            }
        })
        
        let obj = {}
        resposta.data.results.forEach(endereco => {
            endereco.address_components.forEach(component => {
                if(component.types[0] == 'administrative_area_level_2')
                    obj.cidade = component.long_name
                else if(component.types[0] == 'administrative_area_level_1')
                    obj.estado = component.short_name
                else if(component.types[0] == 'country')
                    obj.pais = component.short_name
            })
        })

        obj.custo = lugar.custo
        obj.cobertura = lugar.cobertura

        return obj
    }catch(msg){
        //console.log('Deu ruim', msg)
        return {}
    }
    
} 

function consultarCSV(lugar) {
    //console.log(lugar)
    let estado = lugar.estado == 'BR' || lugar.estado == 'US'?'SP':lugar.estado
    let separador = ','
    const caminho = __dirname+`/../DemographicData/${estado}DemographicData.csv`
    const arquivo = fs.readFileSync(caminho, 'utf-8')
    const linhas = arquivo.split('\n')
    const analisePopulacional = linhas.map(linha => {
        dados = linha.split(separador)
        return {id: dados[0], nome: dados[1], estado, cobertura: lugar.cobertura, custo: lugar.custo}
    }).filter(elemento => elemento.id != 'Posição' && elemento.id != '' && elemento.id != 'Position')
    return analisePopulacional.find(linha => linha.nome === lugar.cidade)
}

//app.get('/', (req, res) => {res.send('Teste')})

app.post('/construirJSON', (req, res, next) => {
    //Tratamento do arquivo
    //Tratar os hospitais/estados que recebi
    const {lugares} = req.body

    const promises = lugares.map(lugar => ajax(lugar))

    Promise.all(promises).then(resultado => {
        const filtro = resultado.filter(local => local.pais === 'BR' && local !== {} && local !== undefined)
        const mapeamento = filtro.map(lugar => consultarCSV(lugar))
        //Montar o array de cidades, custo, ids, cobertura
        const cover = {value: []}
        const city = {value: []}
        const cost = {value: []}
        mapeamento.forEach(lugar => {
            cover.value.push(lugar.cobertura)
            city.value.push(`${lugar.estado}-${lugar.id}`)
            cost.value.push(lugar.custo)
        })

        res.status(200).send(JSON.stringify({city, cover, cost}))
        
    })
})

//process.env.PORT || 3000
app.listen(3000, () => {
    console.log('Aplicação rodando')
})