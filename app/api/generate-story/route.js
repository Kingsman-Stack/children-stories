import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  childName: z.string().trim().min(1).max(60).regex(/^[\p{L}\p{M} .'’-]+$/u),
  age: z.enum(['toddler', 'early-reader', 'middle-grade']),
  theme: z.string().trim().min(1).max(40),
  lesson: z.string().trim().max(500).default(''),
  language: z.string().trim().min(2).max(40),
  avoidTitles: z.array(z.string().max(200)).max(100).default([]),
});

const recipes = [
  ['Map of Moonlight', 'found a folded map tucked inside a sleepy old book', 'a curious firefly named Pip'],
  ['Pocket-Sized Star', 'heard a tiny ping coming from a pocket-sized star', 'a cheerful cloud rabbit'],
  ['Door in the Tree', 'noticed a little blue door in the oldest tree', 'a shy squirrel with a magnificent hat'],
  ['Singing River', 'followed a sparkling song to the edge of a singing river', 'a whale who knew every song in the world'],
  ['Rainbow Bicycle', 'woke up to find a rainbow bicycle waiting by the window', 'a giggling dragon with mismatched socks'],
  ['Clockwork Garden', 'discovered a garden where the flowers ticked like tiny clocks', 'a gentle robot with a daisy heart'],
  ['Cloud Castle', 'climbed a staircase made of clouds above the rooftops', 'a cloud giant who collected lullabies'],
  ['Secret Shell', 'found a glowing shell beneath the waves', 'a brave seahorse wearing a crown'],
];

const words = ['Golden', 'Whispering', 'Starlight', 'Wonderful', 'Brave', 'Dancing', 'Hidden', 'Twinkling', 'Magical', 'Silly'];
const packs = {
  portuguese: { once: 'Era uma vez', found: 'encontrou', journey: 'entrou em uma aventura', met: 'conheceu', learned: 'descobriu que', home: 'O caminho para casa brilhava com estrelas.' },
  spanish: { once: 'Érase una vez', found: 'encontró', journey: 'entró en una aventura', met: 'conoció a', learned: 'descubrió que', home: 'El camino a casa brillaba con estrellas.' },
  french: { once: 'Il était une fois', found: 'a trouvé', journey: 'est parti pour une aventure', met: 'a rencontré', learned: 'a découvert que', home: 'Le chemin du retour brillait comme des étoiles.' },
  german: { once: 'Es war einmal', found: 'fand', journey: 'begab sich auf ein Abenteuer', met: 'traf', learned: 'entdeckte, dass', home: 'Der Heimweg funkelte wie ein Stern.' },
  english: { once: 'Once upon a twinkly time', found: 'found', journey: 'stepped into a wonderful adventure', met: 'met', learned: 'discovered that', home: 'The path home shimmered with stars.' },
};

function languagePack(language) {
  const key = language.toLowerCase();
  return packs[key] || packs.english;
}

function localStory(input) {
  const pack = languagePack(input.language);
  const avoided = new Set(input.avoidTitles);
  const available = recipes.flatMap(recipe => words.map(word => `${input.childName} and the ${word} ${recipe[0]}`)).filter(title => !avoided.has(title));
  const title = available[Math.floor(Math.random() * Math.max(available.length, 1))] || `${input.childName} and the ${words[Math.floor(Math.random() * words.length)]} Adventure ${Date.now()}`;
  const recipe = recipes.find(item => title.includes(item[0])) || recipes[0];
  const recipeIndex = recipes.indexOf(recipe);
  const name = input.childName;
  const lesson = input.lesson || (input.language.toLowerCase() === 'portuguese' ? 'a bondade pode começar com um pequeno gesto' : 'being brave can start with one tiny step');
  const language = input.language.toLowerCase();
  if (language === 'portuguese') {
    const portugueseTitles = ['Luar', 'Estrelinha', 'Porta Encantada', 'Rio Cantante', 'Bicicleta Arco-Íris', 'Jardim Reluzente', 'Castelo de Nuvens', 'Concha Secreta'];
    const portugueseOpenings = ['encontrou um mapa dobrado escondido dentro de um livro sonolento', 'ouviu um pequeno som vindo de uma estrela do tamanho de um bolso', 'notou uma portinha azul na árvore mais antiga', 'seguiu uma canção brilhante até um rio que cantava', 'acordou e encontrou uma bicicleta de arco-íris junto à janela', 'descobriu um jardim onde as flores faziam tic-tac', 'subiu uma escada feita de nuvens acima dos telhados', 'encontrou uma concha brilhante debaixo das ondas'];
    const portugueseFriends = ['um vaga-lume curioso chamado Pip', 'um coelho alegre feito de nuvens', 'um esquilo tímido com um chapéu magnífico', 'uma baleia que conhecia todas as canções do mundo', 'um dragão risonho com meias diferentes', 'um robô gentil com um coração de margarida', 'um gigante de nuvens que colecionava canções de ninar', 'um cavalo-marinho corajoso usando uma coroa'];
    const portugueseTitle = `${name} e a Aventura do ${portugueseTitles[recipeIndex]}`;
    return {
      theme: input.theme,
      language: input.language,
      title: avoided.has(portugueseTitle) ? `${portugueseTitle} ${Date.now()}` : portugueseTitle,
      paragraphs: [
        `Era uma vez, ${name} ${portugueseOpenings[recipeIndex]}. Tudo brilhava suavemente, como se estivesse esperando por ele.`,
        `${name} entrou em uma maravilhosa aventura de ${input.theme.toLowerCase()} e conheceu ${portugueseFriends[recipeIndex]}. Juntos, atravessaram uma ponte de folhas douradas, deram três gargalhadas e ajudaram uma pequena luz perdida a encontrar o caminho de casa.`,
        `No fim da viagem, ${name} descobriu que ${lesson}. O caminho para casa brilhava com estrelas.`,
      ],
    };
  }
  return {
    theme: input.theme,
    language: input.language,
    title,
    paragraphs: [
      `${pack.once}, ${name} ${pack.found} ${recipe[1]}. It glowed softly, as if it had been waiting just for them.`,
      `${name} ${pack.journey} and ${pack.met} ${recipe[2]}. Together, they crossed a bridge of golden leaves, shared three giggles, and helped a lost little light find its way home.`,
      `${name} ${pack.learned} ${lesson}. ${pack.home}`,
    ],
  };
}

async function aiStory(input) {
  const prompt = `Create one safe, original children's story as JSON only. Return exactly {"title":"string","theme":"string","language":"string","paragraphs":["string","string","string"]}. Write the entire story in ${input.language}. Child name: ${input.childName}. Age band: ${input.age}. Theme: ${input.theme}. Lesson: ${input.lesson || 'a gentle positive lesson'}. Use age-appropriate vocabulary, culturally natural phrasing, no frightening violence, no sexual content, no dangerous instructions, and do not repeat any of these titles: ${input.avoidTitles.join(' | ')}.`;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022', max_tokens: 900, temperature: 0.95, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!response.ok) throw new Error('AI provider request failed');
  const data = await response.json();
  const text = data.content?.find(item => item.type === 'text')?.text || '';
  const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
  return { theme: input.theme, language: input.language, title: String(parsed.title), paragraphs: parsed.paragraphs.map(String).slice(0, 6) };
}

export async function POST(request) {
  try {
    const input = requestSchema.parse(await request.json());
    if (process.env.ANTHROPIC_API_KEY) {
      try { return NextResponse.json({ story: await aiStory(input) }); }
      catch { return NextResponse.json({ story: localStory(input), fallback: true }); }
    }
    return NextResponse.json({ story: localStory(input), fallback: true });
  } catch {
    return NextResponse.json({ error: 'Invalid story request.' }, { status: 400 });
  }
}
