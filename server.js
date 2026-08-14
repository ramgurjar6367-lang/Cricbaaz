require("dotenv").config();
const express=require("express"),path=require("path");
const app=express(),PORT=process.env.PORT||3000,KEY=process.env.CRICKET_API_KEY;
app.use(express.json()); app.use(express.static(path.join(__dirname,"public")));

async function api(endpoint, extra=""){
 if(!KEY) throw Error("CRICKET_API_KEY is not configured");
 const r=await fetch(`https://api.cricapi.com/v1/${endpoint}?apikey=${encodeURIComponent(KEY)}&offset=0${extra}`);
 const j=await r.json(); if(!r.ok) throw Error("Cricket API request failed"); return j;
}
app.get("/api/live",async(_,res)=>{try{res.json(await api("currentMatches"))}catch(e){res.status(502).json({error:e.message})}});
app.get("/api/matches",async(_,res)=>{try{res.json(await api("matches"))}catch(e){res.status(502).json({error:e.message})}});
app.get("/api/scorecard/:id",async(req,res)=>{try{res.json(await api("match_scorecard",`&id=${encodeURIComponent(req.params.id)}`))}catch(e){res.status(502).json({error:e.message})}});
app.get("/api/players",async(req,res)=>{try{res.json(await api("players",`&search=${encodeURIComponent(req.query.search||"")}`))}catch(e){res.status(502).json({error:e.message})}});
app.get("/api/player/:id",async(req,res)=>{try{res.json(await api("players_info",`&id=${encodeURIComponent(req.params.id)}`))}catch(e){res.status(502).json({error:e.message})}});
app.get("/api/health",(_,res)=>res.json({ok:true,apiConfigured:Boolean(KEY)}));

let articles=[
{id:1,category:"India",title:"India's next big Test challenge",excerpt:"The latest team news, tactics and talking points.",body:"Cricbaaz brings you the key talking points, tactical questions and player storylines around India's next Test challenge. This is a sample editorial article that can be replaced with your own reporting before launch.",date:"2026-08-14",author:"Cricbaaz Desk"},
{id:2,category:"International",title:"World cricket: players to watch",excerpt:"A look at the names making headlines.",body:"International cricket is full of emerging players and big performances. This sample article demonstrates the full article-reading experience on Cricbaaz.",date:"2026-08-14",author:"Cricbaaz Desk"},
{id:3,category:"Analysis",title:"How modern tactics are changing cricket",excerpt:"A closer look at strategy and match-ups.",body:"Modern cricket is increasingly shaped by match-ups, field settings, bowling changes and data. Cricbaaz analysis will turn those ideas into readable stories for fans.",date:"2026-08-14",author:"Cricbaaz Analysis"}
];
app.get("/api/articles",(_,res)=>res.json({data:articles}));
app.get("/api/articles/:id",(req,res)=>{const a=articles.find(x=>x.id==req.params.id);a?res.json(a):res.status(404).json({error:"Article not found"})});
app.post("/api/articles",(req,res)=>{
 if(!process.env.ADMIN_KEY||req.headers["x-admin-key"]!==process.env.ADMIN_KEY)return res.status(401).json({error:"Unauthorized"});
 const {category="News",title,excerpt="",body=""}=req.body||{};
 if(!title||!body)return res.status(400).json({error:"Title and body required"});
 const a={id:Date.now(),category,title,excerpt,body,date:new Date().toISOString().slice(0,10),author:"Cricbaaz Desk"};
 articles.unshift(a);res.status(201).json(a);
});
app.listen(PORT,()=>console.log(`Cricbaaz running on port ${PORT}`));
