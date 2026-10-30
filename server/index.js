import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(cors()); app.use(express.json({ limit: '20kb' }));
const cases = new Map();
const schema = new mongoose.Schema({ prompt: String, status: { type: String, default: 'active' }, createdAt: { type: Date, default: Date.now }, mystery: mongoose.Schema.Types.Mixed, playerSubmission: mongoose.Schema.Types.Mixed });
const CaseSession = mongoose.models.CaseSession || mongoose.model('CaseSession', schema);

const baseCase = {
 title: 'The Last Light at Bellwether', synopsis: 'At 9:17 PM, the lighthouse beam went dark. Minutes later, its keeper was found unconscious and the original Fresnel lens was gone. The storm sealed the causeway. Whoever took it was already inside.',
 suspects: [
  { id: 's1', name: 'Mara Voss', role: 'Lighthouse keeper', alibi: 'Says she was in the generator room restoring power.', motive: 'The lighthouse was about to be decommissioned, ending her family’s generations-long stewardship.', avatarUrl: 'MV' },
  { id: 's2', name: 'Elliot Crane', role: 'Antique dealer', alibi: 'Claims he stayed in the guest house, cataloguing his collection.', motive: 'A private buyer offered enough to erase his mounting debts.', avatarUrl: 'EC' },
  { id: 's3', name: 'June Park', role: 'Documentary filmmaker', alibi: 'Says she was filming waves from the west balcony.', motive: 'A sensational theft would make her stalled film impossible to ignore.', avatarUrl: 'JP' },
  { id: 's4', name: 'Tomas Reed', role: 'Coast guard volunteer', alibi: 'Was monitoring the radio in the boathouse.', motive: 'The lens’s brass fittings could fund his family’s repair shop.', avatarUrl: 'TR' }
 ],
 evidence: [
  { id: 'ev1', type: 'whatsapp_chat', title: 'Recovered messages', description: 'A thread restored from the keeper’s tablet. One message was deleted.', data: { messages: [ { sender: 'Mara', timestamp: '8:41 PM', text: 'The spare key is back under the blue pot.' }, { sender: 'Elliot', timestamp: '8:44 PM', text: 'You said the west stair was still locked.' }, { sender: 'Mara', timestamp: '8:46 PM', text: 'It is. Use the service ladder.' }, { sender: 'Elliot', timestamp: '8:47 PM', text: 'That ladder was removed last month.' }, { sender: 'Mara', timestamp: '8:49 PM', text: 'Then you should have checked before coming.' } ] } },
  { id: 'ev2', type: 'security_cam', title: 'East landing · 9:12 PM', description: 'Motion-triggered frame recovered from the rain-battered exterior camera.', data: { camTranscript: '21:12:08 — Figure enters from the EAST landing.\n21:12:41 — Figure pauses beneath the clock.\n21:13:02 — A brief flash of reflected brass.\n21:13:19 — Figure exits toward the keeper’s quarters.' } },
  { id: 'ev3', type: 'document', title: 'Generator service log', description: 'Handwritten maintenance entries for the lighthouse power system.', data: { document: 'BELLWETHER LIGHTHOUSE — SERVICE LOG\n\n20:30  Generator tested. Fuel: ¾ tank.\n20:52  Main breaker stable. No faults.\n21:17  Beam outage reported by shore station.\n21:24  Backup circuit manually tripped.\n\nNote: backup switch is inside the keeper’s quarters.' } },
  { id: 'ev4', type: 'crime_scene_photo', title: 'The keeper’s quarters', description: 'Evidence photo taken after the room was secured.', data: { camTranscript: 'A thin line of brass dust crosses the threshold. The window latch is untouched. Mud on the floor carries a narrow heel pattern, pointing inward from the corridor.' } },
  { id: 'ev5', type: 'document', title: 'Causeway access record', description: 'The storm-watch register kept at the shore station.', data: { document: 'SHORE STATION — ACCESS REGISTER\n\n20:10  June Park — arrival, footbridge\n20:38  Tomas Reed — boathouse check\n20:51  Elliot Crane — guest house\n21:05  Causeway closed by storm surge\n21:31  No departures recorded\n\nOnly the keeper holds a key to the interior service door.' } }
 ],
 culpritId: 's1', solutionExplanation: 'Mara’s messages reveal she knew the service ladder had been removed, yet she told Elliot to use it. She was testing whether he would come inside. The east landing footage shows someone carrying brass toward the keeper’s quarters, while the outage was caused by the backup switch located in her own room. The causeway log rules out anyone leaving during the storm.',
};

const outputSchema = { type: 'OBJECT', properties: { title: { type: 'STRING' }, synopsis: { type: 'STRING' }, suspects: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, name: { type: 'STRING' }, role: { type: 'STRING' }, alibi: { type: 'STRING' }, motive: { type: 'STRING' } }, required: ['id','name','role','alibi','motive'] } }, evidence: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, type: { type: 'STRING' }, title: { type: 'STRING' }, description: { type: 'STRING' }, data: { type: 'OBJECT', properties: { messages: { type: 'ARRAY', items: { type: 'OBJECT', properties: { sender: { type: 'STRING' }, timestamp: { type: 'STRING' }, text: { type: 'STRING' } }, required: ['sender','timestamp','text'] } }, camTranscript: { type: 'STRING' }, document: { type: 'STRING' } } }, pointsToSuspectId: { type: 'STRING' } }, required: ['id','type','title','description','data'] } }, culpritId: { type: 'STRING' }, solutionExplanation: { type: 'STRING' } }, required: ['title','synopsis','suspects','evidence','culpritId','solutionExplanation'] };

async function generateMystery(scenario) {
 if (!process.env.GEMINI_API_KEY) return { ...baseCase, title: scenario.length > 0 ? 'The Last Light at Bellwether' : baseCase.title };
 try {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Create an original, solvable detective mystery based on this premise: ${scenario}. Make exactly 4 suspects and 5 interconnected evidence items. Include at least one whatsapp_chat with messages, and evidence of types security_cam, document, crime_scene_photo. The evidence must logically prove one culprit; ensure explanation references evidence. Keep content fictional and concise.`, config: { responseMimeType: 'application/json', responseSchema: outputSchema } });
  return JSON.parse(result.text);
 } catch (err) { console.error('Gemini generation failed; using local case:', err.message); return baseCase; }
}
function publicCase(sessionId, mystery) { const { culpritId, solutionExplanation, ...safe } = mystery; safe.evidence = (safe.evidence || []).map(({ pointsToSuspectId, ...item }) => item); return { sessionId, ...safe }; }
app.post('/api/cases/generate', async (req, res) => {
 const scenario = String(req.body?.scenario || '').trim().slice(0, 1000);
 if (scenario.length < 8) return res.status(400).json({ error: 'Give the case a premise of at least 8 characters.' });
 try { const mystery = await generateMystery(scenario); const record = { prompt: scenario, mystery }; let sessionId;
  if (mongoose.connection.readyState === 1) { const doc = await CaseSession.create(record); sessionId = String(doc._id); } else { sessionId = randomUUID(); cases.set(sessionId, record); }
  res.json(publicCase(sessionId, mystery));
 } catch (e) { res.status(500).json({ error: 'Could not open this case. Try again.' }); }
});
app.get('/api/cases/:id', async (req, res) => { let record = cases.get(req.params.id); if (!record && mongoose.connection.readyState === 1 && mongoose.isValidObjectId(req.params.id)) record = await CaseSession.findById(req.params.id).lean(); if (!record) return res.status(404).json({ error: 'Case not found.' }); res.json(publicCase(req.params.id, record.mystery)); });
app.post('/api/cases/:id/accuse', async (req, res) => {
 const suspectId = String(req.body?.suspectId || ''); const reasoning = String(req.body?.playerReasoning || '').slice(0, 2000);
 let record = cases.get(req.params.id); let doc;
 if (!record && mongoose.connection.readyState === 1 && mongoose.isValidObjectId(req.params.id)) { doc = await CaseSession.findById(req.params.id); record = doc?.toObject(); }
 if (!record) return res.status(404).json({ error: 'Case not found.' });
 const correct = suspectId === record.mystery.culpritId; const culprit = record.mystery.suspects.find(s => s.id === record.mystery.culpritId);
 const result = { isCorrect: correct, actualCulprit: culprit?.id, actualCulpritName: culprit?.name, solutionExplanation: record.mystery.solutionExplanation, verdictFeedback: correct ? 'Case closed. The evidence supports your conclusion.' : 'The evidence points elsewhere. Review the timeline and reconsider.' };
 if (doc) { doc.status = correct ? 'solved' : 'failed'; doc.playerSubmission = { accusedSuspectId: suspectId, playerReasoning: reasoning, isCorrect: correct, feedback: result.verdictFeedback }; await doc.save(); } else { record.playerSubmission = { accusedSuspectId: suspectId, playerReasoning: reasoning, isCorrect: correct, feedback: result.verdictFeedback }; cases.set(req.params.id, record); }
 res.json(result);
});
const port = Number(process.env.PORT) || 4000;
if (process.env.MONGODB_URI) mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected')).catch(e => console.error('MongoDB unavailable:', e.message));
app.listen(port, () => console.log(`AI Mystery API listening on http://localhost:${port}`));
