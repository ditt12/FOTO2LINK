require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// ambil token dari .env
const BOT_TOKEN = process.env.BOT_TOKEN;
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

// inisialisasi bot
const bot = new Telegraf(BOT_TOKEN);

// handle foto
bot.on('photo', async (ctx) => {
  try {
    // ambil file id dari foto yang dikirim user
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

    // dapatkan link file dari telegram
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // download foto sementara
    const response = await axios.get(fileLink.href, { responseType: 'stream' });
    const filePath = `./temp_image.jpg`;
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    // tunggu proses download selesai
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // upload foto ke imgbb
    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));

    const uploadResponse = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, form, {
      headers: form.getHeaders(),
    });

    // kirim link hasil upload
    const link = uploadResponse.data.data.url;
    await ctx.reply(`Foto berhasil di-upload! Link: ${link}`);

    // hapus file sementara
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error processing photo:', error);
    await ctx.reply('Maaf, ada masalah waktu upload fotonya.');
  }
});

// mulai bot
bot.launch();
console.log('Bot berjalan...');
