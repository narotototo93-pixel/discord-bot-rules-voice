const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error('DISCORD_TOKEN is not set!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ]
});

const rules = [
  { title: '📜 القاعدة 1: الاحترام', description: 'يجب احترام جميع الأعضاء. ممنوع الإهانة أو التنمر أو التحرش بأي شكل.' },
  { title: '🚫 القاعدة 2: ممنوع السبام', description: 'ممنوع إرسال رسائل متكررة أو روابط بدون إذن أو إعلانات في القنوات.' },
  { title: '🔞 القاعدة 3: محتوى مناسب', description: 'ممنوع نشر محتوى غير لائق أو عنيف أو مخالف لقوانين ديسكورد.' },
  { title: '🎙️ القاعدة 4: الفويس', description: 'ممنوع التشويش في قنوات الصوت. احترم المتحدثين ولا تستخدم مؤثرات صوتية مزعجة.' },
  { title: '📛 القاعدة 5: الأسماء', description: 'يجب استخدام أسماء مناسبة ومقروءة. ممنوع الأسماء المسيئة أو المضللة.' },
  { title: '🔒 القاعدة 6: الخصوصية', description: 'ممنوع مشاركة معلومات شخصية للأعضاء الآخرين بدون إذنهم.' },
  { title: '⚠️ القاعدة 7: الأوامر', description: 'استخدم الأوامر في القنوات المخصصة فقط. لا تسبم الأوامر.' },
  { title: '👑 القاعدة 8: الإدارة', description: 'قرارات الإدارة نهائية. إذا عندك مشكلة تواصل مع الإدارة بأدب.' }
];

const commands = [
  new SlashCommandBuilder()
    .setName('rules')
    .setDescription('عرض قوانين السيرفر')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('join')
    .setDescription('البوت يدخل للفويس شانيل')
    .toJSON()
];

client.once('ready', async () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'rules') {
    await handleRulesCommand(interaction);
  } else if (interaction.commandName === 'join') {
    await handleJoinCommand(interaction);
  }
});

async function handleRulesCommand(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📋 قوانين السيرفر')
    .setDescription('**يرجى قراءة القوانين والالتزام بها لضمان بيئة آمنة ومريحة للجميع.**\n\n' +
      '⚡ مخالفة القوانين = عقوبات (تحذير ← ميوت ← كيك ← بان)\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━')
    .setColor(0xFF0000)
    .setTimestamp()
    .setFooter({ text: '⚠️ الجهل بالقوانين لا يعفيك من العقوبة' });

  rules.forEach((rule) => {
    embed.addFields({ name: rule.title, value: rule.description, inline: false });
  });

  embed.addFields({ name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━\n✅ **بالموافقة على البقاء في السيرفر، أنت توافق على جميع القوانين أعلاه.**' });

  await interaction.reply({ embeds: [embed] });
}

async function handleJoinCommand(interaction) {
  const member = interaction.member;

  if (!member.voice.channel) {
    return interaction.reply({
      content: '❌ يجب أن تكون في قناة صوتية أولاً!',
      ephemeral: true
    });
  }

  const voiceChannel = member.voice.channel;

  try {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfMute: false,
      selfDeaf: true
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log(`🎙️ Connected to voice channel: ${voiceChannel.name}`);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch (error) {
        connection.destroy();
      }
    });

    await interaction.reply({
      content: `✅ دخلت لـ **${voiceChannel.name}**! 🎙️ المايك مفتوح و الديفن مفعل.`,
      ephemeral: false
    });
  } catch (error) {
    console.error('Voice join error:', error);
    await interaction.reply({
      content: '❌ ما قدرتش ندخل للفويس. تأكد أن البوت عندو الصلاحيات.',
      ephemeral: true
    });
  }
}

client.login(TOKEN);
