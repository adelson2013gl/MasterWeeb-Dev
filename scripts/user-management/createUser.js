const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Substitua pelas suas chaves reais do Supabase
const SUPABASE_URL = 'https://nfwdgkjrkmrjsfnbmsrd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5md2Rna2pya21yanNmbmJtc3JkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA0NDAxOCwiZXhwIjoyMDY0NjIwMDE4fQ.e7yiJnjoZ0AhgdLBbGFsGNZwmbz54-N22iy9L6Fn6mw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.post('/criar-admin-temp', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
