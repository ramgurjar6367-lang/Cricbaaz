require("dotenv").config();
const express=require("express"),path=require("path"),app=express(),PORT=process.env.PORT||3000,KEY=process.env.CRICKET_API_KEY;
app.use(express.json());app.use(express.static(path.join(__dirname,"public")));
async function api(e,x=""){if(!KEY)throw Error("CRICKET_API_KEY is not configured");const r=await fetch(`https://api.cricapi.com/v1/${e}?apikey=${encodeURIComponent(KEY)}&offset=0${x}`),j=await r.json();if(!r.ok)throw Error("API request failed");return j}
app.get("/api/live",async(_,s)=>{try{s.json(await api("currentMatches"))}catch(e){s.status(502).json({error:e.message})}});
app.get("/api/scorecard/:id",async(q,s)=>{try{s.json(await api("match_scorecard",`&id=${encodeURIComponent(q.params.id)}`))}catch(e){s.status(502).json({error:e.message})}});
app.get("/api/players",async(q,s)=>{try{s.json(await api("players",`&search=${encodeURIComponent(q.query.search||"")}`))}catch(e){s.status(502).json({error:e.message})}});
app.get("/api/player/:id",async(q,s)=>{try{s.json(await api("players_info",`&id=${encodeURIComponent(q.params.id)}`))}catch(e){s.status(502).json({error:e.message})}});
let articles=[{id:1,category:"India",title:"India's next big Test challenge",excerpt:"Latest team news, tactics and talking points.",body:"Cricbaaz coverage of India's next Test challenge. This sample story demonstrates the full article experience and can be replaced with your own reporting.",date:"2026-08-14",author:"Cricbaaz Desk"},{id:2,category:"International",title:"World cricket: players to watch",excerpt:"Names making headlines around world cricket.",body:"A sample Cricbaaz international story. Full articles can be published through the admin API.",date:"2026-08-14",author:"Cricbaaz Desk"}];
app.get("/api/articles",(_,s)=>s.json({data:articles}));app.get("/api/articles/:id",(q,s)=>{let a=articles.find(x=>x.id==q.params.id);a?s.json(a):s.status(404).json({error:"Not found"})});
app.listen(PORT,()=>console.log("Cricbaaz running on "+PORT));