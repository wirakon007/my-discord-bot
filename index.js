const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ]
});

const clientToken = process.env.DISCORD_TOKEN;
const TARGET_CHANNEL_ID = '1550094871111671908'; // ไอดีห้องแจ้งเตือน

client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('setup-panel')
            .setDescription('ส่งปุ่มเปิดระบบส่งคำเชิญ SpaceX ทาง DM')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(clientToken);
    try {
        for (const [guildId] of client.guilds.cache) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guildId),
                { body: commands },
            );
        }
        console.log('Successfully registered slash commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'setup-panel') {
            const embed = new EmbedBuilder()
                .setColor(0x0066FF)
                .setTitle('🚀 SpaceX Official Recruitment Panel')
                .setDescription('Click the button below to send an exclusive long-form SpaceX invitation via User ID across all bot servers.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('open_dm_modal')
                    .setLabel('📩 Send SpaceX Invitation (DM)')
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }
    else if (interaction.isButton()) {
        if (interaction.customId === 'open_dm_modal') {
            const modal = new ModalBuilder()
                .setCustomId('spacex_dm_modal')
                .setTitle('Send SpaceX Invitation by ID');

            const userIdInput = new TextInputBuilder()
                .setCustomId('userid_input')
                .setLabel('User ID ของผู้รับ (เลข 18 หลัก)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('เช่น 387192837192837192')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(userIdInput));
            await interaction.showModal(modal);
        }
    }
    else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'spacex_dm_modal') {
            await interaction.deferReply({ ephemeral: true });

            const targetUserId = interaction.fields.getTextInputValue('userid_input').trim();

            try {
                // ค้นหาผู้ใช้จากทุกเซิร์ฟเวอร์ที่บอทอยู่
                let targetUser = null;
                
                // ลองดึงจากระบบสากลของ Discord ก่อน
                targetUser = await client.users.fetch(targetUserId).catch(() => null);

                // ข้อความเชิญชวนภาษาอังกฤษขนาดยาว พร้อมลิงก์ทางการ SpaceX
                const invitationEmbed = new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle('🚀 OFFICIAL SPACEX CAREERS & INNOVATION INVITATION')
                    .setDescription(`Dear Visionary Innovator,

We are reaching out to you on behalf of the **SpaceX Recruitment & Interplanetary Expansion Division**. Elon Musk and our core engineering teams have been closely evaluating prospective candidates who demonstrate exceptional potential to redefine the boundaries of aerospace engineering, software architecture, and multi-planetary survival systems.

**About the Mission:**
SpaceX is on a relentless pursuit to revolutionize space technology, with the ultimate and profound objective of enabling human life on Mars and making humanity a multi-planetary species. Building reusable orbital-class rockets like Starship requires extraordinary minds willing to tackle seemingly impossible engineering challenges.

**Why You Have Been Selected:**
Your digital footprint and profile suggest an intrinsic drive toward advanced creation, problem-solving, and technical exploration. We believe your unique perspective could play a vital role in accelerating our upcoming lunar and Martian orbital initiatives.

**Next Steps & Official Resources:**
To formally review our active aerospace programs, career pathways, and technical documentation, please access our official portals below:
• **Official Website:** [https://www.spacex.com](https://www.spacex.com)
• **Careers Portal:** [https://www.spacex.com/careers](https://www.spacex.com/careers)

*“I think it’s possible for ordinary people to choose to be extraordinary.” — Elon Musk*

We look forward to seeing how your capabilities might shape the future of space exploration. Welcome to the frontier of tomorrow.`)
                    .setFooter({ text: 'SpaceX Global Talent Acquisition • Automated Dispatch System' })
                    .setTimestamp();

                if (!targetUser) {
                    return interaction.editReply({ content: `❌ ไม่พบผู้ใช้ ID \`${targetUserId}\` ในระบบ` });
                }

                // ส่ง DM ไปหาเป้าหมาย
                await targetUser.send({ embeds: [invitationEmbed] });

                // แจ้งผลในห้องเซิร์ฟเวอร์หลัก
                const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);
                if (targetChannel) {
                    targetChannel.send(`✅ ส่งข้อความเชิญชวน SpaceX ทาง DM ไปยัง **<@${targetUser.id}> (${targetUser.tag})** สำเร็จแล้ว!`);
                }

                await interaction.editReply({ content: `✅ ส่งข้อความเชิญชวนทาง DM ไปหา **${targetUser.tag}** สำเร็จเรียบร้อยแล้ว!` });

            } catch (error) {
                console.error('ไม่สามารถส่ง DM ได้:', error);
                // แจ้งเตือนข้อจำกัดให้ชัดเจนกรณีที่ติดกำแพง API ของ Discord
                await interaction.editReply({ content: `❌ ส่งไม่สำเร็จ: ระบบ Discord ปฏิเสธการส่ง DM (ผู้ใช้นี้ไม่ได้อยู่ในเซิร์ฟเวอร์เดียวกับบอท หรือปิดรับ DM จากคนแปลกหน้า)` });
            }
        }
    }
});

client.login(clientToken);