/**
 * Demo seed script — "The Weight of Tides"
 * Run with: DATABASE_URL=... tsx scripts/seed-demo.ts
 *
 * Creates 6 users, a full novel project with content, a chapter planner,
 * collaborators, join requests, suggestions, feedback, ratings, messages,
 * bookmarks, a pitch, and ink ledger entries.
 */

import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db, pool } from "@workspace/db";
import * as schema from "@workspace/db";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt.toString("hex")}`;
}

// ─── Novel content ────────────────────────────────────────────────────────────

const NOVEL_CONTENT = `Chapter One: Harbour Road

The ferry came in low against the grey, its hull dark with salt and the particular exhaustion of things that have crossed water too many times. Mara Sinclair stood at the top of the slipway and watched it dock. She had not been back to Kinbrae in eleven years, and the town looked smaller than she remembered it — or perhaps she had simply grown into a person who found small things harder to bear.

Her father's solicitor, a compact man named Erskine who smelled of pipe tobacco and damp wool, had telephoned on a Tuesday. She had been in the middle of a meeting about quarterly projections when her assistant knocked and held up a piece of paper: Family emergency. She had not known, until that moment, that she still had family left to constitute one.

The house on Harbour Road was unlocked. This did not surprise her. In Kinbrae, locks were considered mildly impolite, a suggestion that you thought your neighbours capable of theft. Her father had believed this with the conviction of a man who had never owned anything worth stealing. Mara let herself in through the green door — still green, still two inches too narrow for a comfortable entry — and stood in the hall while the smell of the place assembled itself around her: coal smoke, old paper, the ghost of her mother's cooking that had somehow outlasted her mother by thirty years.

The kitchen was tidy. This surprised her. Gordon Sinclair had not been a tidy man in life; he had been the sort of man who left cups wherever he finished them and regarded the washing-up as an activity for people with less interesting things to think about. But the kitchen was clean, the worktops bare, and on the table there was a brown envelope with her name written on it in handwriting she did not recognise.

She did not open it that evening. She made tea instead, found a tin of shortbread in the cupboard above the kettle — her father's cupboard of last resort, unchanged — and sat at the kitchen table until the light went from gold to grey to the particular dark blue of a Scottish coastal night. The envelope sat opposite her like a patient interlocutor.


Chapter Two: The Brass Key

In the morning she opened the envelope.

Inside was a letter, three pages in the same unfamiliar handwriting, and a brass key on a loop of string. The key was small and flat, the sort that belonged to a bureau or a lockbox rather than a door. She had never seen it before.

The letter was from a woman named Agnes Corrigan, who described herself as a friend of her father's — old friend, she had written, and underlined it twice as though she suspected the phrase might be contested. Agnes Corrigan lived, according to the letter, in the cottage at the end of the Brae Road, and had been keeping something in trust for Gordon for many years. She was ready to give it back now, she wrote, if Mara wished to come. There was no pressure in the letter, and somehow that made it more pressurising than any demand could have.

Mara rang Erskine.

"Agnes Corrigan," he said, with the particular flatness of a man who knew more than he was contracted to reveal. "Yes. Your father mentioned her, in passing."

"Do you know what she was keeping for him?"

A pause. "I have some idea. I think it would be better if you spoke with her directly."

Mara walked to the end of Brae Road after breakfast. The cottage was small and set back from the road behind a garden that had been loved and then let go, daffodils pushing through the grass with the cheerful indifference of things that do not need permission to exist. Agnes Corrigan answered the door before she knocked. She was in her mid-seventies, Mara estimated, with the upright posture of someone who had decided at an early age that the world would not see her stoop, and she looked at Mara for a long moment before she spoke.

"You have her eyes," Agnes said. "I had wondered."

Mara did not ask whose eyes. She was not ready, yet, to ask that question.

They had tea — this was Kinbrae, and tea was the medium through which all difficult things were approached — and Agnes talked about the town, about Gordon, about the way the harbour had changed since the fish processing plant closed. She talked about these things with the practised ease of someone warming the engine before the real journey begins. And then, when the pot was empty and the shortbread finished, she got up and brought a cardboard box from the back room and placed it on the table between them.

"He asked me to make sure you got this," Agnes said. "Not Erskine. You. He was very particular about that."


Chapter Three: Low Water

The box contained letters. Forty-one of them, Mara counted, bundled in groups with rubber bands that had perished to brittleness. They were addressed to her father, but the handwriting on the envelopes was not the same as Agnes's. It was a rounder, younger hand, and the postmarks, where she could read them, ranged from 1973 to 1981. The last one was dated the October of the year she was born.

She read them in the order they were bundled, sitting at Agnes's kitchen table while Agnes moved quietly around the cottage, giving her the gift of privacy in a small space. The letters were from a woman named Catherine. They were full of ordinary things at first — weather, work, the difficulty of the buses from Edinburgh — and then gradually less ordinary, the way letters between two people become when those people have stopped performing and started telling the truth. By the fifth bundle Mara understood, with the calm clarity of a thing that has been true for a long time before you know it, that Catherine had loved her father very much. And that her father had loved Catherine. And that something had happened between them that was larger than either of them had known how to carry.

The last letter was short. Three paragraphs. Mara read it twice, then set it face-down on the table and looked at the window and the grey sky beyond it and the rooftops of Kinbrae sloping toward the water.

Agnes appeared in the doorway.

"She died," Agnes said, "two years after she wrote that last one. An accident on the A9. She had a sister in Inverness who wrote to your father to tell him. He never spoke of it to me, but I could see it in him after that. Something went quiet."

Mara thought of the kitchen tidy and the envelope on the table and the handwriting she did not recognise. Agnes's handwriting.

"He asked you to write the envelope," Mara said.

"His hands had gone. Arthritis. He could still hold a cup but not a pen." Agnes sat down across from her. "He wanted it to reach you. He was afraid that if he left it to Erskine it would get filed somewhere and you'd never see it, or you'd see it too late, when it felt like nothing but old sadness."

"What is it meant to feel like?"

Agnes considered this with the seriousness it deserved. "An explanation," she said finally. "And perhaps an apology. He wasn't a man who could say the large things aloud. But he was a man who knew the large things mattered."


Chapter Four: What the Salt Carries

Mara stayed in Kinbrae for three weeks.

She had planned to stay for four days — long enough to deal with the house, sign the papers, arrange the clearance. She extended by a day, then three, then a week, and stopped explaining it to herself or to the people at work who needed explaining to. The house on Harbour Road had a particular quality of holding her. She could not have said whether this was grief or curiosity or something that had no clean name.

She read the letters again. Then she read them a third time, slowly, making notes in the margins of a notebook she found in her father's desk — he had been a margin-noter too, she discovered, his old books dense with pencilled observations in a handwriting she recognised from birthday cards and the backs of photographs. She felt, reading those margins, something she had not expected to feel: that he had been a person, fully, separate from being her father. That his interiority had been vast and she had only ever seen the surface of it, the way you see the surface of water and forget, most of the time, about the depth.

Catherine had been her mother. This was what the last letter said, simply, without drama: I am going to have the baby, Gordon. I know you feel it can't work, and I think you're right, and I'm not asking anything of you except this — that you take care of her, if she needs it. She'll have your name. She won't know, unless you decide she should.

Mara had a mother. Had had one, for two years, without knowing it. And had had a father who had kept this in a box in another woman's cottage for thirty years because he could not find the words, or the moment, or the courage, or perhaps all three.

On the last evening she walked down to the harbour. The tide was out, and the boats sat in the mud with the patience of things that trust the water will return. The smell of the place was ancient — salt and diesel and something organic and briny that Mara associated, now, with the idea of permanence. Things that had smelled this way for centuries. Things that would smell this way long after she and her grief and her discovery had passed through.

She thought about Catherine, who had loved her father. She thought about her father, who had loved Catherine and had not known, until too late, that love is not diminished by being named. She thought about herself, who had lived thirty-nine years as one kind of person and was now, standing at the low-water mark in the dark, beginning to understand that she might be another kind entirely — not different, but more complete. A self with a fuller history. A life with more rooms in it than she had known to look for.

The water would come back. It always did.

She turned and walked up the slipway toward the lights of Harbour Road, and the green door, and the kettle, and the long work of trying to understand what she had been given.`;

// ─── Main seed function ───────────────────────────────────────────────────────

async function seed() {
  console.log("🌱  Starting demo seed…\n");

  // ── 1. Users ──────────────────────────────────────────────────────────────
  console.log("Creating users…");
  const pw = await hashPassword("demo1234");

  const [eleanor, james, priya, tom, saoirse, david] = await db
    .insert(schema.usersTable)
    .values([
      {
        name: "Eleanor Marsh",
        email: "eleanor@demo.writersroom",
        passwordHash: pw,
        role: "author",
        subscriptionTier: "pro",
        bio: "Literary fiction author based in Edinburgh. Debut novel shortlisted for the Saltire Award. Interested in memory, place, and the stories families keep hidden.",
        credentials: "MA Creative Writing (St Andrews), Saltire Award shortlist 2021",
        genres: JSON.stringify(["Literary Fiction", "Contemporary Fiction", "Historical Fiction"]),
        mediaInterests: "Novels, Short Stories",
        openToApproach: true,
        profilePublic: true,
        emailVerified: true,
        emailNotifications: true,
      },
      {
        name: "James Okafor",
        email: "james@demo.writersroom",
        passwordHash: pw,
        role: "both",
        subscriptionTier: "free",
        bio: "Structural editor and writer. Fifteen years in trade publishing before going independent. I help authors find the architecture their story is trying to build.",
        credentials: "Former Senior Editor, Hodder & Stoughton. Structural editing certificate, Faber Academy.",
        genres: JSON.stringify(["Literary Fiction", "Crime", "Thriller"]),
        mediaInterests: "Novels",
        openToApproach: true,
        profilePublic: true,
        emailVerified: true,
        emailNotifications: true,
      },
      {
        name: "Priya Mehta",
        email: "priya@demo.writersroom",
        passwordHash: pw,
        role: "contributor",
        subscriptionTier: "free",
        bio: "Creative writing tutor and developmental editor. Particular interest in novels that centre diaspora experience and questions of cultural inheritance.",
        credentials: "PhD English Literature (Durham), Creative Writing tutor at Arvon Foundation",
        genres: JSON.stringify(["Literary Fiction", "Women's Fiction", "Short Stories"]),
        mediaInterests: "Novels, Short Story Collections",
        openToApproach: true,
        profilePublic: true,
        emailVerified: true,
        emailNotifications: false,
      },
      {
        name: "Tom Callahan",
        email: "tom@demo.writersroom",
        passwordHash: pw,
        role: "both",
        subscriptionTier: "free",
        bio: "Debut novelist working on a family saga set across three generations in the west of Ireland. Looking for readers who'll tell me the truth.",
        credentials: "Curtis Brown Creative alumni. Work in progress excerpt published in The Stinging Fly.",
        genres: JSON.stringify(["Literary Fiction", "Historical Fiction", "Irish Literature"]),
        mediaInterests: "Novels",
        openToApproach: true,
        profilePublic: true,
        emailVerified: true,
        emailNotifications: true,
      },
      {
        name: "Saoirse Flynn",
        email: "saoirse@demo.writersroom",
        passwordHash: pw,
        role: "both",
        subscriptionTier: "free",
        bio: "Writer and editor. Published in Granta, The Dublin Review, and Banshee. Former slush reader for an independent literary press — I know what makes a manuscript stand out.",
        credentials: "Published in Granta, The Dublin Review, Banshee. Former submissions editor, Tramp Press.",
        genres: JSON.stringify(["Literary Fiction", "Short Stories", "Essay"]),
        mediaInterests: "Novels, Short Stories, Essays",
        openToApproach: false,
        profilePublic: true,
        emailVerified: true,
        emailNotifications: true,
      },
      {
        name: "David Chen",
        email: "david@demo.writersroom",
        passwordHash: pw,
        role: "contributor",
        subscriptionTier: "free",
        bio: "Screenwriter transitioning to prose. Background in TV drama means I think hard about structure, scene function, and whether every page earns its place.",
        credentials: "Screenwriting credits: Channel 4, BBC Wales. Goldsmiths MA in Creative Writing (Prose), in progress.",
        genres: JSON.stringify(["Literary Fiction", "Crime", "Thriller"]),
        mediaInterests: "Novels, Scripts",
        openToApproach: true,
        profilePublic: true,
        emailVerified: true,
        emailNotifications: true,
      },
    ])
    .returning();

  console.log(`  ✓ ${[eleanor, james, priya, tom, saoirse, david].map(u => u.name).join(", ")}`);

  // ── 2. Project ────────────────────────────────────────────────────────────
  console.log("Creating project…");
  const [project] = await db
    .insert(schema.projectsTable)
    .values({
      title: "The Weight of Tides",
      type: "book",
      ownerId: eleanor.id,
      content: NOVEL_CONTENT,
      synopsis: "When Mara Sinclair returns to the Scottish coastal town of Kinbrae after her father's death, she expects to find only paperwork and the quiet work of grief. Instead, she finds a box of letters and a brass key — and a truth about her own origins that her father spent thirty years trying, and failing, to name. A novel about inheritance, silence, and the things love leaves behind.",
      genres: JSON.stringify(["Literary Fiction", "Contemporary Fiction", "Scottish Fiction"]),
      notes: "Aiming for that Claire Keegan territory — restraint, precision, weight in the white space. Every scene should earn its place. Thinking about how silence functions as a form of language between people who love each other badly.",
      ownershipTerms: "sole",
      ownershipNotes: "All intellectual property remains with Eleanor Marsh. Contributors are credited in acknowledgements and receive a signed copy on publication.",
      collaboratorLimit: 6,
      isPublished: true,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      publishVisibility: "all",
      feedbackEnabled: true,
      feedbackAudience: "all",
      feedbackVisibility: "public",
      contentMode: "full",
    })
    .returning();

  console.log(`  ✓ "${project.title}" (id: ${project.id})`);

  // ── 3. Collaborators ──────────────────────────────────────────────────────
  console.log("Adding collaborators…");
  await db.insert(schema.collaboratorsTable).values([
    { projectId: project.id, userId: james.id },
    { projectId: project.id, userId: priya.id },
    { projectId: project.id, userId: tom.id },
    { projectId: project.id, userId: saoirse.id },
    { projectId: project.id, userId: david.id },
  ]);
  console.log("  ✓ 5 collaborators added");

  // ── 4. Join requests ──────────────────────────────────────────────────────
  console.log("Creating join requests…");
  await db.insert(schema.joinRequestsTable).values([
    {
      projectId: project.id,
      userId: james.id,
      message: "I've been working in literary fiction for fifteen years and I think I can add real structural value here. The premise is compelling — I'd love to be involved.",
      status: "accepted",
    },
    {
      projectId: project.id,
      userId: priya.id,
      message: "The emotional territory of this novel is exactly what I work in — secrets, inheritance, the weight of what parents don't say. I'd bring close reading and developmental feedback.",
      status: "accepted",
    },
    {
      projectId: project.id,
      userId: tom.id,
      message: "Working on something thematically similar myself — family, place, what gets passed down. Would love to swap notes and offer a reader's eye.",
      status: "accepted",
    },
    {
      projectId: project.id,
      userId: saoirse.id,
      message: "Read the opening and found myself wanting the next chapter immediately. That's rare. I'd like to contribute wherever I'm useful.",
      status: "accepted",
    },
    {
      projectId: project.id,
      userId: david.id,
      message: "Coming from a screenwriting background, I think about scene function and structure quite differently from prose writers — that might be useful, or it might be annoying. Happy to find out.",
      status: "accepted",
    },
  ]);
  console.log("  ✓ 5 join requests (all accepted)");

  // ── 5. Suggestions ────────────────────────────────────────────────────────
  console.log("Creating suggestions…");
  const [sug1, sug2, sug3] = await db
    .insert(schema.suggestionsTable)
    .values([
      {
        projectId: project.id,
        submitterId: james.id,
        originalText: "She had not been back to Kinbrae in eleven years, and the town looked smaller than she remembered it — or perhaps she had simply grown into a person who found small things harder to bear.",
        suggestedText: "She had not been back to Kinbrae in eleven years. The town looked smaller than she remembered, which she had expected. What she had not expected was to find this made it harder, not easier, to bear.",
        comment: "The original is lovely but I think the clause works against you slightly — 'or perhaps' hedges where the prose should commit. Two sentences lets the logic land with more weight.",
        status: "pending",
        votingOpen: true,
      },
      {
        projectId: project.id,
        submitterId: saoirse.id,
        originalText: "Agnes appeared in the doorway.",
        suggestedText: "Agnes appeared in the doorway with the unhurried quality of someone who had been waiting on the other side of it for some time.",
        comment: "Agnes is doing a lot of delicate work in this scene. I think giving her this entrance earns us more trust in her — she's been holding this secret for decades. She moves like someone practiced in patience.",
        status: "accepted",
        votingOpen: false,
        ownerNote: "Yes — this is exactly right. She needs this presence. Accepted.",
      },
      {
        projectId: project.id,
        submitterId: priya.id,
        originalText: "A self with a fuller history. A life with more rooms in it than she had known to look for.",
        suggestedText: "A self with a fuller history. A life with more rooms in it — rooms she had not known to look for because no one had told her the house was larger than the part she lived in.",
        comment: "The metaphor is working so well here. I wanted to extend it just slightly to make the parental dimension more present — she didn't know because she wasn't told. Might be overwriting it though, happy to be ignored.",
        status: "discarded",
        votingOpen: false,
        ownerNote: "I love the instinct but I think the existing image is doing its work quietly. Adding the explanation takes away the reader's job. Keeping the original but thank you — this helped me see why it works.",
      },
    ])
    .returning();

  console.log("  ✓ 3 suggestions created");

  // ── 6. Suggestion votes ───────────────────────────────────────────────────
  console.log("Creating suggestion votes…");
  await db.insert(schema.suggestionVotesTable).values([
    // Votes on suggestion 1 (pending, voting open)
    { suggestionId: sug1.id, userId: priya.id,   vote: "amendment" },
    { suggestionId: sug1.id, userId: tom.id,     vote: "original"  },
    { suggestionId: sug1.id, userId: david.id,   vote: "amendment" },
    { suggestionId: sug1.id, userId: saoirse.id, vote: "original"  },
    // Votes on suggestion 2 (accepted)
    { suggestionId: sug2.id, userId: james.id,   vote: "amendment" },
    { suggestionId: sug2.id, userId: priya.id,   vote: "amendment" },
    { suggestionId: sug2.id, userId: tom.id,     vote: "amendment" },
    { suggestionId: sug2.id, userId: david.id,   vote: "original"  },
  ]);
  console.log("  ✓ 8 votes cast");

  // ── 7. Feedback ───────────────────────────────────────────────────────────
  console.log("Creating feedback…");
  await db.insert(schema.feedbackTable).values([
    {
      projectId: project.id,
      userId: james.id,
      content: "The structural decision to withhold Catherine's identity until the third chapter is working beautifully. The reader feels the weight of what Mara doesn't know before they know it themselves. Chapter Two is the one I'd look at — Agnes's entrance and the reveal of the box could move slightly faster. We're keen to read the letters; let us.",
    },
    {
      projectId: project.id,
      userId: priya.id,
      content: "What's exceptional here is the restraint. The prose never tells us how to feel and that makes us feel it more. The low-water image at the end of Chapter Four is doing serious work — the whole novel is in those two pages. My only note: Erskine. He needs one more beat. Right now he's a function. Give him a tell, something that makes him a person who has been holding this secret and finds it uncomfortable.",
    },
    {
      projectId: project.id,
      userId: tom.id,
      content: "Read this in a single sitting, which for a working novelist is either a compliment or a problem depending on what I was supposed to be doing. The dialogue is exceptional — specifically the way nobody quite says what they mean and the reader understands everything. 'You have her eyes' is one of the best opening lines of a scene I've read in years.",
    },
    {
      projectId: project.id,
      userId: david.id,
      content: "Thinking about this as a screenwriter: every scene has a clear dramatic function, which is rarer than it sounds in literary fiction. The ferry arrival establishes Mara's estrangement. The kitchen establishes the father's mystery. Agnes's cottage is the inciting incident disguised as a social call. The architecture is sound. Chapter Three is where I'd focus — the letter-reading is the emotional climax but we experience it at a slight remove. Consider whether Mara needs to be more present in her own moment of discovery.",
    },
    {
      projectId: project.id,
      userId: saoirse.id,
      content: "The coastal setting is doing real thematic work rather than just atmosphere — tide, low water, the ferry, the slipway. These aren't decorative, they're structural. The ending earns its image because you've been laying the groundwork from page one. I'd push back slightly on 'ancient' in the penultimate paragraph — it's the one word that feels borrowed rather than earned. Everything else is entirely your own.",
    },
  ]);
  console.log("  ✓ 5 feedback entries");

  // ── 8. Ratings ────────────────────────────────────────────────────────────
  console.log("Creating ratings…");
  await db.insert(schema.ratingsTable).values([
    { projectId: project.id, userId: james.id,   rating: 5 },
    { projectId: project.id, userId: priya.id,   rating: 5 },
    { projectId: project.id, userId: tom.id,     rating: 5 },
    { projectId: project.id, userId: saoirse.id, rating: 4 },
    { projectId: project.id, userId: david.id,   rating: 4 },
  ]);
  console.log("  ✓ 5 ratings (avg 4.6)");

  // ── 9. Structure planner ──────────────────────────────────────────────────
  console.log("Creating structure planner…");
  const [planner] = await db
    .insert(schema.plannersTable)
    .values({
      ownerId: eleanor.id,
      projectId: project.id,
      title: "The Weight of Tides — Chapter Plan",
      synopsis: "An eight-chapter structure moving from Mara's arrival in Kinbrae to her final decision about what to do with what she has learned. Each chapter should end with a question the next chapter answers — and opens a new one.",
      mediaType: "book",
    })
    .returning();

  console.log(`  ✓ Planner created (id: ${planner.id})`);

  // ── 10. Planner cards ─────────────────────────────────────────────────────
  console.log("Creating planner cards…");
  await db.insert(schema.plannerCardsTable).values([
    {
      plannerId: planner.id,
      position: 0,
      episodeNumber: "1",
      title: "Harbour Road",
      logline: "Mara arrives in Kinbrae after her father's death and enters a house she no longer knows how to inhabit.",
      synopsis: "Establish Mara's estrangement from the town and her father. The green door. The tidy kitchen. The envelope with her name in unfamiliar handwriting. End on the envelope, unopened.",
      theme: "Estrangement, return, the weight of what we avoid",
      characterArc: "Mara: guarded, competent, hollowed by grief she hasn't yet named",
      characters: JSON.stringify(["Mara Sinclair", "Erskine (solicitor)"]),
      tags: JSON.stringify(["Arrival", "Kinbrae", "Setup"]),
      status: "complete",
      wordCount: 620,
      targetWordCount: 600,
      assignee: "Eleanor Marsh",
      notes: "The tidy kitchen is important — it should feel wrong. Mara should notice it feels wrong without being able to say why yet.",
    },
    {
      plannerId: planner.id,
      position: 1,
      episodeNumber: "2",
      title: "The Brass Key",
      logline: "Mara opens the envelope, visits Agnes Corrigan, and receives a box she is not yet ready to open.",
      synopsis: "Agnes is the hinge of the novel — she holds the truth and chooses the right moment to offer it. The scene must establish her as trustworthy before the box appears. Tea, conversation, history. Then the box.",
      theme: "Trust, the ethics of keeping secrets, patience",
      characterArc: "Agnes: reveal her as someone who has carried this for decades. Still upright. Still clear-eyed.",
      characters: JSON.stringify(["Mara Sinclair", "Agnes Corrigan"]),
      tags: JSON.stringify(["Agnes", "Mystery", "The Box"]),
      status: "complete",
      wordCount: 680,
      targetWordCount: 650,
      assignee: "Eleanor Marsh",
      notes: "James's note: don't rush the box. Agnes has waited decades. The scene should feel like waiting.",
    },
    {
      plannerId: planner.id,
      position: 2,
      episodeNumber: "3",
      title: "Low Water",
      logline: "Mara reads the letters and understands who Catherine was — and what the last letter means.",
      synopsis: "The emotional centre of the novel. Mara reads chronologically; we move with her from ordinary correspondence to love to the final revelation. Agnes gives her privacy. The reveal must be quiet — no drama, just clarity.",
      theme: "Revelation, the failure of silence, love as burden",
      characterArc: "Mara: the ground shifts beneath her. She doesn't collapse — she goes still.",
      characters: JSON.stringify(["Mara Sinclair", "Agnes Corrigan", "Catherine (through letters)", "Gordon Sinclair (through letters)"]),
      tags: JSON.stringify(["Revelation", "Catherine", "Letters", "The Truth"]),
      status: "complete",
      wordCount: 590,
      targetWordCount: 700,
      assignee: "Eleanor Marsh",
      notes: "Priya's note: Mara must be more present in her own moment. David's note: consider POV shift — can we get closer?",
    },
    {
      plannerId: planner.id,
      position: 3,
      episodeNumber: "4",
      title: "What the Salt Carries",
      logline: "Mara stays in Kinbrae longer than planned and finds, in her father's books and margins, the person he was.",
      synopsis: "The aftermath chapter. Mara extends her stay, reads her father's books, walks to the harbour. The novel closes with the low-tide image and Mara beginning to integrate what she has learned.",
      theme: "Integration, forgiveness without absolution, love that outlasts understanding",
      characterArc: "Mara: not resolved, but no longer frozen. She can move again.",
      characters: JSON.stringify(["Mara Sinclair", "Gordon Sinclair (through traces)"]),
      tags: JSON.stringify(["Resolution", "Harbour", "Tide", "Ending"]),
      status: "complete",
      wordCount: 710,
      targetWordCount: 700,
      assignee: "Eleanor Marsh",
    },
    {
      plannerId: planner.id,
      position: 4,
      episodeNumber: "5",
      title: "The Sister in Inverness",
      logline: "Mara decides to find Catherine's sister — the woman who wrote to her father to say Catherine had died.",
      synopsis: "A chapter not yet written. Mara acts on the information in the letters. She traces the sister, whose name she finds in the final letter. This section should open the novel outward — beyond Kinbrae, beyond the past.",
      theme: "Agency, choosing what to do with truth",
      characterArc: "Mara: from receiving to reaching",
      characters: JSON.stringify(["Mara Sinclair", "Catherine's Sister (unnamed)"]),
      tags: JSON.stringify(["To Write", "Inverness", "Extension"]),
      status: "outline",
      wordCount: 0,
      targetWordCount: 700,
      assignee: "Eleanor Marsh",
      notes: "Does the novel need this chapter? James thinks yes — we need to see Mara choose. David thinks the harbour ending is strong enough. Eleanor TBD.",
    },
    {
      plannerId: planner.id,
      position: 5,
      episodeNumber: "6",
      title: "What the Sister Knows",
      logline: "Mara meets Catherine's sister and learns the version of events Catherine told.",
      synopsis: "The sister has her own version of the story — and it's not quite the same as the letters. This discrepancy is the final complication. Mara must decide what truth she wants to carry.",
      theme: "Multiple truths, the story we choose to live with",
      characterArc: "Mara: confronting the impossibility of knowing everything",
      characters: JSON.stringify(["Mara Sinclair", "Catherine's Sister"]),
      tags: JSON.stringify(["To Write", "Complication", "Truth"]),
      status: "draft",
      wordCount: 0,
      targetWordCount: 650,
      assignee: "Eleanor Marsh",
    },
    {
      plannerId: planner.id,
      position: 6,
      episodeNumber: "7",
      title: "Gordon's Version",
      logline: "Through Erskine, Mara accesses the account her father left with his will — what he wanted her to know, in his own words.",
      synopsis: "The father's voice, finally. A recorded statement Erskine was instructed to give Mara only if she came to Agnes first. Gives Gordon his full humanity — not an explanation, but a person trying to explain.",
      theme: "Parental failure, the limits of love, belated honesty",
      characterArc: "Gordon Sinclair: posthumously rounded. Not forgiven necessarily. Understood.",
      characters: JSON.stringify(["Mara Sinclair", "Erskine", "Gordon Sinclair (recorded)"]),
      tags: JSON.stringify(["To Write", "Gordon", "Will", "Explanation"]),
      status: "draft",
      wordCount: 0,
      targetWordCount: 700,
      assignee: "Eleanor Marsh",
      notes: "Saoirse's suggestion: Gordon's voice should sound like a man who rehearsed this many times and still isn't sure he's got it right.",
    },
    {
      plannerId: planner.id,
      position: 7,
      episodeNumber: "8",
      title: "High Tide",
      logline: "Mara returns to Kinbrae one final time, a year later, and understands what she is keeping and what she is letting go.",
      synopsis: "The structural mirror of Chapter One — same town, same slipway, but Mara arrived at something. The novel should end on a specific image that rewards re-reading the first page. Tide in, this time.",
      theme: "Return, completion, choosing to live in the present",
      characterArc: "Mara: arrived. Not healed — but whole.",
      characters: JSON.stringify(["Mara Sinclair"]),
      tags: JSON.stringify(["Ending", "Return", "Mirror", "Tide"]),
      status: "outline",
      wordCount: 0,
      targetWordCount: 500,
      assignee: "Eleanor Marsh",
      notes: "The final image must earn the title. High tide — what does the water carry back?",
    },
  ]);
  console.log("  ✓ 8 chapter cards created");

  // ── 11. Planner contributors ──────────────────────────────────────────────
  console.log("Adding planner contributors…");
  await db.insert(schema.plannerContributorsTable).values([
    { plannerId: planner.id, userId: james.id,   role: "editor" },
    { plannerId: planner.id, userId: priya.id,   role: "editor" },
    { plannerId: planner.id, userId: saoirse.id, role: "viewer" },
    { plannerId: planner.id, userId: david.id,   role: "editor" },
    { plannerId: planner.id, userId: tom.id,     role: "viewer" },
  ]);
  console.log("  ✓ 5 planner contributors");

  // ── 12. Messages ──────────────────────────────────────────────────────────
  console.log("Creating messages…");
  await db.insert(schema.messagesTable).values([
    // Eleanor ↔ James
    {
      fromUserId: james.id,
      toUserId: eleanor.id,
      body: "Eleanor — just read through Chapters 1–4. This is the real thing. The restraint is extraordinary. I've left some structural notes in the suggestions. The main thing I'd say: Chapter Three needs you closer to Mara. We're at a distance when we should be inside her skin. Happy to talk it through whenever.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    },
    {
      fromUserId: eleanor.id,
      toUserId: james.id,
      body: "Thank you, James. I know you're right about Three. I think I've been protecting myself from that scene — keeping Mara at arm's length because it's the scene I find hardest to write. Which is probably exactly why I need to go in closer. I'll take another pass this week.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
    },
    {
      fromUserId: james.id,
      toUserId: eleanor.id,
      body: "That tracks. The scenes that feel hardest are usually the ones that matter most. You've already done the hard work of knowing what happens — now it's just a question of trusting yourself to be in it. The prose in Chapter Four shows you can do it. That final harbour page is as good as anything I've read this year.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
    },
    // Eleanor ↔ Priya
    {
      fromUserId: priya.id,
      toUserId: eleanor.id,
      body: "I've been thinking about Erskine since I left my feedback. What if he has one small gesture that reveals he liked Catherine? He's not supposed to have known her well, but what if he did? It would make his reticence more complicated — not professional discretion, but something more personal.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
    {
      fromUserId: eleanor.id,
      toUserId: priya.id,
      body: "Oh — this is interesting. You're right that he's currently quite functional. What if the gesture is something Mara doesn't notice but the reader does? He says Catherine's name before he catches himself and says 'the woman in question' or something like that. Small. Tells us everything.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
    {
      fromUserId: priya.id,
      toUserId: eleanor.id,
      body: "Exactly that. And Mara doesn't notice because she's not listening for it yet — she doesn't know Catherine's name matters. But the reader, on a second read, will catch it. That's the kind of detail that makes people want to re-read from the beginning immediately.",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    },
    // Tom ↔ Eleanor
    {
      fromUserId: tom.id,
      toUserId: eleanor.id,
      body: "Quick question — is 'You have her eyes' Agnes's first line, or did she say something before that we're not hearing? I ask because it reads as a first line but it also reads like the end of a longer internal thought. Either way it's extraordinary. Just want to understand the mechanics.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    },
    {
      fromUserId: eleanor.id,
      toUserId: tom.id,
      body: "It's her first line — no preamble. Agnes has been waiting for this moment for thirty years. She's not going to waste it on hello. The idea is that she's been composing this moment in her head, and when it arrives, she goes straight to the thing that matters. Whether it lands that way for the reader is another question — glad it reads as deliberate.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    },
    // David ↔ Eleanor
    {
      fromUserId: david.id,
      toUserId: eleanor.id,
      body: "Structural question from a TV brain: do Chapters 5–8 exist yet or are they planned? I ask because from a dramatic structure standpoint, Chapter Four could be a series finale — the low tide image closes the loop beautifully. If you're adding chapters, you need a new complication that's proportional to the resolution you've already offered. The sister is the right instinct.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      fromUserId: eleanor.id,
      toUserId: david.id,
      body: "This is exactly the question I'm sitting with. Chapter Four does close something. But I feel like Mara needs to *act* — she's been receiving the whole novel, having things revealed to her, and I want the final movement to be her choosing. The sister feels like the right complication because it opens the question of what you do once you know.",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      fromUserId: david.id,
      toUserId: eleanor.id,
      body: "That's a strong argument. If the four existing chapters are about receiving, the next four can be about choosing. The structural symmetry is there. I'd think carefully about Chapter Eight's ending — if One ends on an unopened envelope and Eight ends on the tide coming in, you've got a satisfying formal logic. The novel is literally breathing.",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
  ]);
  console.log("  ✓ 11 messages created");

  // ── 13. Bookmarks ─────────────────────────────────────────────────────────
  console.log("Creating bookmarks…");
  await db.insert(schema.bookmarksTable).values([
    { authorId: eleanor.id, contributorId: james.id   },
    { authorId: eleanor.id, contributorId: saoirse.id },
    { authorId: tom.id,     contributorId: james.id   },
    { authorId: tom.id,     contributorId: priya.id   },
  ]);
  console.log("  ✓ 4 bookmarks");

  // ── 14. Pitch ─────────────────────────────────────────────────────────────
  console.log("Creating pitch…");
  const [pitch] = await db
    .insert(schema.pitchesTable)
    .values({
      title: "Looking for a structural editor — The Weight of Tides (literary fiction, 80k)",
      description: "Literary fiction novel set in coastal Scotland. Four chapters complete, four planned. Seeking a structural editor with experience in contemporary literary fiction who can help me think through the second half — specifically whether the novel needs four more chapters or whether the existing four are structurally complete. The prose is tight; I'm not looking for line edits. I want someone who thinks architecturally. Payment in kind: acknowledgement, signed copy, and reciprocal reading of your manuscript.",
      type: "book",
      genres: JSON.stringify(["Literary Fiction", "Contemporary Fiction"]),
      status: "open",
      ownerId: eleanor.id,
    })
    .returning();

  console.log(`  ✓ Pitch created (id: ${pitch.id})`);

  // ── 15. Pitch responses ───────────────────────────────────────────────────
  await db.insert(schema.pitchResponsesTable).values([
    {
      pitchId: pitch.id,
      userId: james.id,
      type: "interest",
      message: "Happy to discuss further — already reading the manuscript and have some thoughts on the structure question.",
    },
    {
      pitchId: pitch.id,
      userId: david.id,
      type: "feedback",
      message: "Not the right fit for a formal structural role as I'm mid-project, but the four-vs-eight question is worth thinking about structurally before deciding. Happy to have an informal conversation if useful.",
    },
  ]);
  console.log("  ✓ 2 pitch responses");

  // ── 16. Ink ledger ────────────────────────────────────────────────────────
  console.log("Creating ink ledger…");
  await db.insert(schema.inkLedgerTable).values([
    { userId: eleanor.id, amount: 100, reason: "Account created",                         projectId: null },
    { userId: eleanor.id, amount: 50,  reason: "Project published: The Weight of Tides",  projectId: project.id },
    { userId: eleanor.id, amount: 25,  reason: "Feedback received on project",            projectId: project.id },
    { userId: james.id,   amount: 100, reason: "Account created",                         projectId: null },
    { userId: james.id,   amount: 30,  reason: "Suggestion accepted by project owner",    projectId: project.id },
    { userId: priya.id,   amount: 100, reason: "Account created",                         projectId: null },
    { userId: priya.id,   amount: 20,  reason: "Feedback submitted",                      projectId: project.id },
    { userId: tom.id,     amount: 100, reason: "Account created",                         projectId: null },
    { userId: saoirse.id, amount: 100, reason: "Account created",                         projectId: null },
    { userId: saoirse.id, amount: 30,  reason: "Suggestion accepted by project owner",    projectId: project.id },
    { userId: david.id,   amount: 100, reason: "Account created",                         projectId: null },
  ]);
  console.log("  ✓ 11 ink ledger entries");

  console.log("\n✅  Seed complete!\n");
  console.log("  Project:  \"The Weight of Tides\"");
  console.log("  Users:    eleanor@demo.writersroom  (author, Pro)");
  console.log("            james@demo.writersroom    (contributor)");
  console.log("            priya@demo.writersroom    (contributor)");
  console.log("            tom@demo.writersroom      (contributor)");
  console.log("            saoirse@demo.writersroom  (contributor)");
  console.log("            david@demo.writersroom    (contributor)");
  console.log("  Password: demo1234  (all accounts)\n");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  pool.end();
  process.exit(1);
});
