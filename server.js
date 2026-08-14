
require('dotenv').config();
const express=require('express');
const path=require('path');
const app=express();
const PORT=process.env.PORT||3000;
const KEY=process.env.CRICKET_API_KEY;
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'public')));

async function api(endpoint,extra=''){
  if(!KEY) throw Error('CRICKET_API_KEY is not configured');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const url=`https://api.cricapi.com/v1/${endpoint}?apikey=${encodeURIComponent(KEY)}&offset=0${extra}`;
    const r=await fetch(url,{signal:controller.signal});
    let j={}; try{j=await r.json()}catch{}
    if(!r.ok) throw Error(j.error||`Cricket API request failed (${r.status})`);
    return j;
  }finally{clearTimeout(timer)}
}
function sendApi(res,fn){fn().then(x=>res.json(x)).catch(e=>res.status(502).json({error:e.name==='AbortError'?'Cricket API timed out':e.message}))}
app.get('/api/live',(_,res)=>sendApi(res,()=>api('currentMatches')));
app.get('/api/matches', (req,res)=>{
  // The same matches endpoint is used for recent/upcoming where the provider supports it.
  sendApi(res,()=>api('matches'));
});
app.get('/api/scorecard/:id',(req,res)=>sendApi(res,()=>api('match_scorecard',`&id=${encodeURIComponent(req.params.id)}`)));

const popularPlayers=[
 {name:'Virat Kohli',country:'India',role:'Batter'},
 {name:'Rohit Sharma',country:'India',role:'Batter'},
 {name:'Shubman Gill',country:'India',role:'Batter'},
 {name:'Jasprit Bumrah',country:'India',role:'Bowler'},
 {name:'Ravindra Jadeja',country:'India',role:'All-rounder'},
 {name:'MS Dhoni',country:'India',role:'Wicketkeeper-batter'},
 {name:'Babar Azam',country:'Pakistan',role:'Batter'},
 {name:'Ben Stokes',country:'England',role:'All-rounder'},
 {name:'Kane Williamson',country:'New Zealand',role:'Batter'},
 {name:'Pat Cummins',country:'Australia',role:'Bowler'}
];
app.get('/api/players',(req,res)=>sendApi(res,async()=>{
  const q=(req.query.search||'').trim();
  try{
    const j=await api('players',`&search=${encodeURIComponent(q)}`);
    const data=Array.isArray(j.data)?j.data:[];
    if(data.length)return j;
  }catch(e){ if(!q) throw e; }
  const data=popularPlayers.filter(p=>!q||p.name.toLowerCase().includes(q.toLowerCase()));
  return {data};
}));
app.get('/api/player/:id',(req,res)=>sendApi(res,()=>api('players_info',`&id=${encodeURIComponent(req.params.id)}`)));
app.get('/api/health',(_,res)=>res.json({ok:true,apiConfigured:Boolean(KEY)}));

let articles=[
 {id:1,category:'India',title:'India’s next big Test challenge',excerpt:'Key team news, tactics and talking points.',body:'Cricbaaz brings you the key talking points, tactical questions and player storylines around India’s next Test challenge. This is an editorial demo article and can be replaced with your own reporting.',date:'2026-08-14',author:'Cricbaaz Desk'},
 {id:2,category:'International',title:'World cricket: players to watch',excerpt:'A look at the names making headlines.',body:'International cricket is full of emerging players and big performances. Cricbaaz tracks the players, teams and match-ups that deserve attention.',date:'2026-08-14',author:'Cricbaaz Desk'},
 {id:3,category:'Analysis',title:'How modern tactics are changing cricket',excerpt:'A closer look at strategy and match-ups.',body:'Modern cricket is increasingly shaped by match-ups, field settings, bowling changes and data. Cricbaaz analysis turns those ideas into readable stories for fans.',date:'2026-08-14',author:'Cricbaaz Analysis'},
 {id:4,category:'T20',title:'Why powerplay cricket matters',excerpt:'The first six overs can define a T20 innings.',body:'Powerplay batting is about maximizing scoring opportunities while protecting wickets. Bowling plans, field restrictions and matchup choices all influence the opening phase.',date:'2026-08-14',author:'Cricbaaz Desk'},
 {id:5,category:'Players',title:'The art of building a complete player profile',excerpt:'Runs and wickets are only part of the story.',body:'A useful player profile looks beyond a single score. Role, consistency, match situations and recent form all help explain a player’s impact.',date:'2026-08-14',author:'Cricbaaz Analysis'},
 {id:6,category:'Cricket',title:'What makes a great match centre?',excerpt:'Fast scores, clear scorecards and useful context.',body:'A good match centre should make it easy to understand the score, result, innings and key performances without forcing the reader through confusing screens.',date:'2026-08-14',author:'Cricbaaz Desk'}
];
app.get('/api/articles',(_,res)=>res.json({data:articles}));
app.get('/api/articles/:id',(req,res)=>{const a=articles.find(x=>String(x.id)===String(req.params.id));a?res.json(a):res.status(404).json({error:'Article not found'})});
app.post('/api/articles',(req,res)=>{
 if(!process.env.ADMIN_KEY||req.headers['x-admin-key']!==process.env.ADMIN_KEY)return res.status(401).json({error:'Unauthorized'});
 const {category='News',title,excerpt='',body=''}=req.body||{};
 if(!title||!body)return res.status(400).json({error:'Title and body required'});
 const a={id:Date.now(),category,title,excerpt,body,date:new Date().toISOString().slice(0,10),author:'Cricbaaz Desk'};
 articles.unshift(a);res.status(201).json(a);
});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`Cricbaaz running on port ${PORT}`));
