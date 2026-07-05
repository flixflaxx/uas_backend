const formatWhatsAppMessage = (order) => {
  let message = `*KONFIRMASI PESANAN BARU - FLIXXMART*\n\n`;
  message += `*ID Transaksi:* ${order.transactionId}\n`;
  message += `*Tanggal:* ${new Date(order.date).toLocaleString('id-ID')}\n\n`;
  message += `*Penerima:* ${order.customer.name}\n`;
  message += `*Alamat:* ${order.customer.address}\n`;
  message += `*No. HP:* ${order.customer.phone}\n\n`;
  message += `*Detail Belanja:*\n`;
  order.items.forEach((item, idx) => {
    const itemTotal = item.price * item.quantity;
    message += `${idx + 1}. ${item.name} (${item.quantity}x) - Rp ${itemTotal.toLocaleString('id-ID')}\n`;
  });
  message += `\n*TOTAL PEMBAYARAN:* *Rp ${order.total.toLocaleString('id-ID')}*\n\n`;
  message += `Mohon segera diproses ya Admin, terima kasih! 🙏`;
  return message;
};

const getClickToChatUrl = (message, number) => {
  // Format nomor WA agar hanya berisi angka dan menggunakan format internasional (dimulai 62)
  let formattedNumber = number.replace(/[^0-9]/g, '');
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '62' + formattedNumber.slice(1);
  }
  
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedNumber}?text=${encodedText}`;
};

const sendWhatsAppGateway = async (message, targetNumber) => {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.log('WhatsApp Gateway (Fonnte) dilewati: Token tidak dikonfigurasi.');
    return false;
  }

  // Format target nomor
  let formattedNumber = targetNumber.replace(/[^0-9]/g, '');
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '62' + formattedNumber.slice(1);
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: formattedNumber,
        message: message
      })
    });

    const data = await response.json();
    console.log('Respon WhatsApp Gateway Fonnte:', data);
    return data.status === true;
  } catch (error) {
    console.error('Error saat menghubungi WhatsApp Gateway Fonnte:', error.message);
    return false;
  }
};

module.exports = {
  formatWhatsAppMessage,
  getClickToChatUrl,
  sendWhatsAppGateway
};
