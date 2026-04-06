import {
  Lucid,
  Blockfrost,
  Constr,
  Data
} from "https://unpkg.com/lucid-cardano@0.10.11/web/mod.js";

/* =====================================================
   CONFIG
===================================================== */
const BLOCKFROST_URL = "https://cardano-preprod.blockfrost.io/api/v0";
const BLOCKFROST_KEY = "preprodYjRkHfcazNkL0xxG9C2RdUbUoTrG7wip";
const NETWORK = "Preprod";

/* =====================================================
   GLOBAL STATE
===================================================== */
let lucid;
let walletAddress = "";
let walletPkh = "";
let scriptAddress = "";
let nftPolicyId = "";

/* =====================================================
   INVOICE SCRIPT
===================================================== */
const SCRIPT_CBOR = "590ea8010000323232323233223232323232323232332232323322323232323232323232332232323232323232232323232323223223232533532323232533500315335533553353500422222200210322210331032133573892010e616c72656164792066756e6465640003115335533553353500422222200110311032103213357389210e616c72656164792072657061696400031153355335333573466e20ccc044ccd54c05c4800540554090cc048d40108888880194004050050d40108888880100c40c840c84cd5ce2490f697373756572206e6f74207061696400031153355335533553353500222350022222222222223333500d250362503625036233355302a1200133502b22533500221003100150362350012253355335333573466e3cd400888008d40108800811010c4ccd5cd19b8735002220013500422001044043104313503a0031503900d21350012235001222235009223500222222222222233355302c120012235002222253353501822350062232335005233500425335333573466e3c00800415014c5400c414c814c8cd4010814c94cd4ccd5cd19b8f002001054053150031053153350032153350022133500223350022335002233500223304200200120562335002205623304200200122205622233500420562225335333573466e1c01800c16416054cd4ccd5cd19b870050020590581333573466e1c01000416416041604160414454cd40048414441444cd40f8018014401540e40284c98c80d0cd5ce2481024c6600035103122153350011333573466e1cd4d401888888801488ccc054d4010888800c0080052002034033221035103213357389210b4e4654206d697373696e670003115335533535500122222222222200410312215335001103422103510321335738920112696e766573746f72206d757374207369676e00031103110311031103115335533553353500422222200110311032103213357389210e616c72656164792072657061696400031153355335533535004222222002103122153350011034221035103213357389210b6e6f20696e766573746f7200031153355335333573466e20ccc044ccd54c05c4800540554090cd54c04c480048d4004888800cd54004888888888888028050050d401088888800c0c40c840c84cd5ce2491672657061796d656e7420696e73756666696369656e740003115335533535004222222002103122153350011333573466e20ccc04cccd54c06448005405d4098cc050d400888009400c058058cdc01a8011100099b81350062222220033500622222200403303422103510321335738920111696e766573746f72206e6f74207061696400031103110311031135001220023333573466e1cd55cea80224000466442466002006004646464646464646464646464646666ae68cdc39aab9d500c480008cccccccccccc88888888888848cccccccccccc00403403002c02802402001c01801401000c008cd40ac0b0d5d0a80619a8158161aba1500b33502b02d35742a014666aa05eeb940b8d5d0a804999aa817bae502e35742a01066a0560726ae85401cccd540bc0e9d69aba150063232323333573466e1cd55cea801240004664424660020060046464646666ae68cdc39aab9d5002480008cc8848cc00400c008cd4111d69aba150023045357426ae8940088c98c8124cd5ce02482502389aab9e5001137540026ae854008c8c8c8cccd5cd19b8735573aa004900011991091980080180119a8223ad35742a004608a6ae84d5d1280111931902499ab9c04904a047135573ca00226ea8004d5d09aba2500223263204533573808a08c08626aae7940044dd50009aba1500533502b75c6ae854010ccd540bc0d88004d5d0a801999aa817bae200135742a00460706ae84d5d1280111931902099ab9c04104203f135744a00226ae8940044d5d1280089aba25001135744a00226ae8940044d5d1280089aba25001135744a00226ae8940044d55cf280089baa00135742a00860506ae84d5d1280211931901999ab9c0330340313333573466e1d40152002212200123333573466e1d4019200021220022326320333357380660680620606666ae68cdc39aab9d500b480008cccccc88888848cccccc00401c01801401000c008dd71aba1500b3232323333573466e1cd55cea80124000466aa04c6eb8d5d0a8011bae357426ae8940088c98c80d4cd5ce01a81b01989aab9e5001137540026ae854028dd69aba15009375a6ae854020cd406c8c8c8cccd5cd19b8735573aa00490001199109198008018011bae35742a0046eb4d5d09aba2500223263203533573806a06c06626aae7940044dd50009aba15007302d357426ae89401c8c98c80c4cd5ce01881901788188b09aab9e50011375400226aae74dd500089aba25001135744a00226ae8940044d5d1280089aab9e5001137540024446464600200a640026aa0544466a0029000111a80111299a999ab9a3371e0040120560542600e0022600c006640026aa0524466a0029000111a80111299a999ab9a3371e00400e05405220022600c006446a002444444444444666aa602624002446a00444446a0084466a0044a66a666ae68cdc780b80081b81b099a814003004080410042810005190009aa812110891299a8008a80a91099a80b180200119aa980309000802000a4410012233553007120012350012233550150023355300a12001235001223355018002333500123302a4800000488cc0ac0080048cc0a800520000013355300712001235001223355015002333500123355300b1200123500122335501900235500d0010012233355500800f00200123355300b1200123500122335501900235500c00100133355500300a002001111222333553004120015010335530071200123500122335501500235500900133355300412001223500222533533355300c120013233500e223335003220020020013500122001123300122533500210261001023235001223300a002005006100313350140040035011001335530071200123500122323355016003300100532001355027225335001135500a003221350022253353300c002008112223300200a0041300600300232001355020221122253350011002221330050023335530071200100500400111212223003004112122230010043200135501d22112253350011500e22133500f300400233553006120010040013200135501c2211222533500113500322001221333500522002300400233355300712001005004001122123300100300222333573466e3c00800405c05848c88c008dd6000990009aa80d111999aab9f0012500a233500930043574200460066ae880080688c8c8cccd5cd19b8735573aa004900011991091980080180118079aba150023005357426ae8940088c98c8064cd5ce00c80d00b89aab9e5001137540024646464646666ae68cdc39aab9d5004480008cccc888848cccc00401401000c008c8c8c8cccd5cd19b8735573aa0049000119910919800801801180c1aba15002335010017357426ae8940088c98c8078cd5ce00f00f80e09aab9e5001137540026ae854010ccd54021d728039aba150033232323333573466e1d4005200423212223002004357426aae79400c8cccd5cd19b875002480088c84888c004010dd71aba135573ca00846666ae68cdc3a801a400042444006464c6404066ae700800840780740704d55cea80089baa00135742a00466a018eb8d5d09aba2500223263201a33573803403603026ae8940044d5d1280089aab9e500113754002266aa002eb9d6889119118011bab00132001355017223233335573e0044a010466a00e66aa012600c6aae754008c014d55cf280118021aba20030181357420022244004244244660020080062244246600200600424464646666ae68cdc3a800a400046a00e600a6ae84d55cf280191999ab9a3370ea00490011280391931900a19ab9c014015012011135573aa00226ea800448488c00800c44880048c8c8cccd5cd19b875001480188c848888c010014c01cd5d09aab9e500323333573466e1d400920042321222230020053009357426aae7940108cccd5cd19b875003480088c848888c004014c01cd5d09aab9e500523333573466e1d40112000232122223003005375c6ae84d55cf280311931900919ab9c01201301000f00e00d135573aa00226ea80048c8c8cccd5cd19b8735573aa004900011991091980080180118029aba15002375a6ae84d5d1280111931900719ab9c00e00f00c135573ca00226ea80048c8cccd5cd19b8735573aa002900011bae357426aae7940088c98c8030cd5ce00600680509baa001232323232323333573466e1d4005200c21222222200323333573466e1d4009200a21222222200423333573466e1d400d2008233221222222233001009008375c6ae854014dd69aba135744a00a46666ae68cdc3a8022400c4664424444444660040120106eb8d5d0a8039bae357426ae89401c8cccd5cd19b875005480108cc8848888888cc018024020c030d5d0a8049bae357426ae8940248cccd5cd19b875006480088c848888888c01c020c034d5d09aab9e500b23333573466e1d401d2000232122222223005008300e357426aae7940308c98c8054cd5ce00a80b00980900880800780700689aab9d5004135573ca00626aae7940084d55cf280089baa0012323232323333573466e1d400520022333222122333001005004003375a6ae854010dd69aba15003375a6ae84d5d1280191999ab9a3370ea0049000119091180100198041aba135573ca00c464c6401c66ae7003803c03002c4d55cea80189aba25001135573ca00226ea80048c8c8cccd5cd19b875001480088c8488c00400cdd71aba135573ca00646666ae68cdc3a8012400046424460040066eb8d5d09aab9e500423263200b33573801601801201026aae7540044dd500089119191999ab9a3370ea00290021091100091999ab9a3370ea00490011190911180180218031aba135573ca00846666ae68cdc3a801a400042444004464c6401866ae700300340280240204d55cea80089baa0012323333573466e1d40052002200523333573466e1d40092000200523263200833573801001200c00a26aae74dd5000891001091000a4c92010350543100120012233700004002224646002002446600660040040021";
const invoiceScript = { type: "PlutusV2", script: SCRIPT_CBOR };

/* =====================================================
   NFT POLICY
===================================================== */
const NFT_POLICY_CBOR = "5908a0010000323322332232323232323232323232323232323232323232223232533532325335533553353233019501c001355001222222222222008101c22135002222533500415335333573466e3c00cd401c88cccd40048c98c8078cd5ce2481024c680001f200123263201e3357389201024c680001f23263201e3357389201024c680001f0220211333573466e1c00520020220211021221023101d13357389201226d757374206d696e742065786163746c79206f6e6520646f63756d656e74204e46540001c153355335355001222222222222004101c2215335001101f221020101d133573892011e626f72726f776572206d757374207369676e207472616e73616374696f6e0001c101c135001220023333573466e1cd55cea80124000466442466002006004646464646464646464646464646666ae68cdc39aab9d500c480008cccccccccccc88888888888848cccccccccccc00403403002c02802402001c01801401000c008cd4050054d5d0a80619a80a00a9aba1500b33501401635742a014666aa030eb9405cd5d0a804999aa80c3ae501735742a01066a02803a6ae85401cccd54060079d69aba150063232323333573466e1cd55cea801240004664424660020060046464646666ae68cdc39aab9d5002480008cc8848cc00400c008cd40a1d69aba150023029357426ae8940088c98c80accd5ce01581601489aab9e5001137540026ae854008c8c8c8cccd5cd19b8735573aa004900011991091980080180119a8143ad35742a00460526ae84d5d1280111931901599ab9c02b02c029135573ca00226ea8004d5d09aba2500223263202733573804e05004a26aae7940044dd50009aba1500533501475c6ae854010ccd540600688004d5d0a801999aa80c3ae200135742a00460386ae84d5d1280111931901199ab9c023024021135744a00226ae8940044d5d1280089aba25001135744a00226ae8940044d5d1280089aba25001135744a00226ae8940044d55cf280089baa00135742a00460186ae84d5d1280111931900a99ab9c015016013101516135573ca00226ea800448c88c008dd6000990009aa80c111999aab9f00125018233501730043574200460066ae8800804c8c8c8cccd5cd19b8735573aa004900011991091980080180118051aba150023005357426ae8940088c98c8048cd5ce00900980809aab9e5001137540024646464646666ae68cdc39aab9d5004480008cccc888848cccc00401401000c008c8c8c8cccd5cd19b8735573aa004900011991091980080180118099aba1500233500d012357426ae8940088c98c805ccd5ce00b80c00a89aab9e5001137540026ae854010ccd54021d728039aba150033232323333573466e1d4005200423212223002004357426aae79400c8cccd5cd19b875002480088c84888c004010dd71aba135573ca00846666ae68cdc3a801a400042444006464c6403266ae7006406805c0580544d55cea80089baa00135742a00466a012eb8d5d09aba2500223263201333573802602802226ae8940044d5d1280089aab9e500113754002266aa002eb9d6889119118011bab00132001355015223233335573e0044a02c466a02a66442466002006004600c6aae754008c014d55cf280118021aba200301113574200224464646666ae68cdc3a800a40004642446004006600a6ae84d55cf280191999ab9a3370ea0049001109100091931900819ab9c01001100e00d135573aa00226ea80048c8c8cccd5cd19b875001480188c848888c010014c01cd5d09aab9e500323333573466e1d400920042321222230020053009357426aae7940108cccd5cd19b875003480088c848888c004014c01cd5d09aab9e500523333573466e1d40112000232122223003005375c6ae84d55cf280311931900819ab9c01001100e00d00c00b135573aa00226ea80048c8c8cccd5cd19b8735573aa004900011991091980080180118029aba15002375a6ae84d5d1280111931900619ab9c00c00d00a135573ca00226ea80048c8cccd5cd19b8735573aa002900011bae357426aae7940088c98c8028cd5ce00500580409baa001232323232323333573466e1d4005200c21222222200323333573466e1d4009200a21222222200423333573466e1d400d2008233221222222233001009008375c6ae854014dd69aba135744a00a46666ae68cdc3a8022400c4664424444444660040120106eb8d5d0a8039bae357426ae89401c8cccd5cd19b875005480108cc8848888888cc018024020c030d5d0a8049bae357426ae8940248cccd5cd19b875006480088c848888888c01c020c034d5d09aab9e500b23333573466e1d401d2000232122222223005008300e357426aae7940308c98c804ccd5ce00980a00880800780700680600589aab9d5004135573ca00626aae7940084d55cf280089baa0012323232323333573466e1d400520022333222122333001005004003375a6ae854010dd69aba15003375a6ae84d5d1280191999ab9a3370ea0049000119091180100198041aba135573ca00c464c6401866ae700300340280244d55cea80189aba25001135573ca00226ea80048c8c8cccd5cd19b875001480088c8488c00400cdd71aba135573ca00646666ae68cdc3a8012400046424460040066eb8d5d09aab9e500423263200933573801201400e00c26aae7540044dd500089119191999ab9a3370ea00290021091100091999ab9a3370ea00490011190911180180218031aba135573ca00846666ae68cdc3a801a400042444004464c6401466ae7002802c02001c0184d55cea80089baa0012323333573466e1d40052002200c23333573466e1d40092000200c23263200633573800c00e00800626aae74dd5000a4c92103505431001200132001355006222533500110022213500222330073330080020060010033200135500522225335001100222135002225335333573466e1c005200000c00b13330080070060031333008007335009123330010080030020060031122002122122330010040031220021220011123230010012233003300200200101";
const nftPolicy = { type: "PlutusV2", script: NFT_POLICY_CBOR };

/* =====================================================
   DATUM TYPES
===================================================== */
const Investor = Data.Object({
  invPkh: Data.Bytes(),
  invAmount: Data.Integer(),
});

const AssetClass = Data.Object({
  currencySymbol: Data.Bytes(),
  tokenName: Data.Bytes(),
});

const InvoiceDatum = Data.Object({
  idIssuer: Data.Bytes(),
  idInvoiceNFT: AssetClass,
  idFaceValue: Data.Integer(),
  idRepayment: Data.Integer(),
  idInvestors: Data.Array(Investor),
  isRepaid: Data.Boolean(),
});

function mkInvoiceDatum(
  issuer,
  policyId,
  assetName,
  faceValue,
  repayment,
  investors,
  isRepaid
) {
  return Data.to(
    {
      idIssuer: issuer,
      idInvoiceNFT: {
        currencySymbol: policyId,
        tokenName: assetName,
      },
      idFaceValue: BigInt(faceValue),
      idRepayment: BigInt(repayment),
      idInvestors: investors,
      isRepaid: Boolean(isRepaid),
    },
    InvoiceDatum
  );
}

/* =====================================================
   REDEEMERS
===================================================== */
const nftRedeemer = Data.to(new Constr(0, []));
const fundRedeemer = Data.to(new Constr(0, []));
const repayRedeemer = Data.to(new Constr(1, []));

/* =====================================================
   HELPERS
===================================================== */
function log(msg) {
  const el = document.getElementById("log");
  if (el) el.textContent = String(msg ?? "");
  console.log(msg);
}

function chunkString(str, size = 64) {
  const out = [];
  for (let i = 0; i < str.length; i += size) {
    out.push(str.slice(i, i + size));
  }
  return out;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(raw) {
  try {
    const u = new URL(String(raw || ""), window.location.origin);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    return "";
  } catch {
    return "";
  }
}

function isImageMime(mime) {
  return ["image/png", "image/jpeg", "image/webp"].includes(String(mime || "").toLowerCase());
}

function documentPreviewUrl(invoice) {
  if (isImageMime(invoice.document_mime) && invoice.document_url) {
    return safeUrl(invoice.document_url);
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
      <rect width="100%" height="100%" fill="#0b1020"/>
      <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle"
            fill="#eaeaf0" font-family="Inter, Arial" font-size="36">Invoice Document</text>
      <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle"
            fill="#9aa4bf" font-family="Inter, Arial" font-size="18">PDF / Non-image preview</text>
    </svg>
  `;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function shortHash(h) {
  if (!h) return "";
  return h.length > 12 ? `${h.slice(0, 6)}...${h.slice(-4)}` : h;
}

function shortInvoiceId(id) {
  if (!id) return "-";
  return id.length > 10 ? `${id.slice(0, 10)}...` : id;
}

function formatDateTime(iso) {
  const s = (iso || "").replace(" ", "T");
  const d = new Date(s);
  if (isNaN(d.getTime())) return iso || "";
  return d.toLocaleString();
}

function formatAmount(lovelaceStr, unit) {
  if (!lovelaceStr) return "-";
  if ((unit || "lovelace") === "lovelace") {
    const ada = Number(BigInt(lovelaceStr)) / 1_000_000;
    return `₳${ada.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  return `${lovelaceStr} ${unit || ""}`.trim();
}

function prettyType(action) {
  const map = {
    create_invoice: "Minting",
    fund_invoice: "Funding",
    repay_invoice: "Repayment"
  };
  return map[action] || action;
}

function statusPill(status) {
  const s = (status || "").toLowerCase();
  let className = "status-badge";
  if (s === "confirmed" || s === "success" || s === "minted" || s === "funded" || s === "repaid") className += " success";
  else if (s === "submitted" || s === "pending") className += " pending";
  else if (s === "failed") className += " failed";
  return `<span class="${className}">${escapeHtml(status || "submitted")}</span>`;
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Accept": "application/json",
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    },
    ...options
  });

  const out = await res.json().catch(() => null);
  if (!res.ok || !out?.ok) {
    throw new Error(out?.error || `Request failed: ${url}`);
  }
  return out;
}

function showModal(title, html) {
  const overlay = document.getElementById("notifyModal");
  const t = document.getElementById("nmTitle");
  const b = document.getElementById("nmBody");
  const ok = document.getElementById("nmOk");

  if (!overlay || !t || !b || !ok) {
    alert(title + "\n\n" + String(html).replace(/<[^>]+>/g, ""));
    return;
  }

  t.textContent = title;
  b.innerHTML = html;
  overlay.style.display = "flex";

  const close = () => {
    overlay.style.display = "none";
    ok.removeEventListener("click", close);
    overlay.removeEventListener("click", onOverlayClick);
    document.removeEventListener("keydown", onEsc);
  };

  const onOverlayClick = (e) => {
    if (e.target === overlay) close();
  };

  const onEsc = (e) => {
    if (e.key === "Escape") close();
  };

  ok.addEventListener("click", close);
  overlay.addEventListener("click", onOverlayClick);
  document.addEventListener("keydown", onEsc);
}

/* =====================================================
   WALLET STATUS
===================================================== */
async function ensureRegisteredWalletOrFail(address) {
  const out = await jsonFetch("wallet_status.php", {
    method: "POST",
    body: JSON.stringify({ address })
  });

  if (!out.hasVerifiedWallet) {
    return { allowed: true };
  }

  if (!out.allowed) {
    throw new Error("This wallet is not registered for your account. Please connect your registered wallet.");
  }

  return { allowed: true };
}

/* =====================================================
   FILE UPLOAD
===================================================== */
async function uploadInvoiceFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("save_invoice.php", {
    method: "POST",
    credentials: "include",
    body: formData
  });

  const out = await res.json().catch(() => null);
  if (!res.ok || !out?.ok) {
    throw new Error(out?.error || "Invoice upload failed.");
  }

  return out;
}

/* =====================================================
   DATABASE FETCH
===================================================== */
async function fetchMarketplaceInvoices() {
  const out = await jsonFetch("get_invoices.php", { method: "GET" });
  return Array.isArray(out.invoices) ? out.invoices : [];
}

async function fetchMyFundedInvoices() {
  const out = await jsonFetch("get_my_funded_invoices.php", { method: "GET" });
  return Array.isArray(out.invoices) ? out.invoices : [];
}

/* =====================================================
   UTXO LOOKUP BY INVOICE REF
===================================================== */
async function findInvoiceUtxo(invoiceRef) {
  const utxos = await lucid.utxosAt(scriptAddress);

  for (const u of utxos) {
    if (!u.datum) continue;

    let d;
    try {
      d = Data.from(u.datum, InvoiceDatum);
    } catch {
      continue;
    }

    const unit = d.idInvoiceNFT.currencySymbol + d.idInvoiceNFT.tokenName;
    if (unit === invoiceRef) {
      return { utxo: u, datum: d };
    }
  }

  return null;
}

/* =====================================================
   LOAD & RENDER INVOICES
===================================================== */
function renderInvoiceCard(invoice, mode) {
  const card = document.createElement("div");
  card.className = "invoice-card";

  const imageUrl = documentPreviewUrl(invoice);

  const img = document.createElement("img");
  img.alt = "Invoice NFT";
  img.src = imageUrl;
  img.style.cursor = "pointer";

  const openUrl = safeUrl(invoice.document_url);
  if (openUrl) {
    img.addEventListener("click", () => window.open(openUrl, "_blank", "noopener,noreferrer"));
  }

  const title = document.createElement("h4");
  title.textContent = "Invoice NFT";

  const p1 = document.createElement("p");
  p1.textContent = `Face Value: ₳${(Number(invoice.face_value_lovelace) / 1_000_000).toFixed(2)}`;

  const p2 = document.createElement("p");
  p2.textContent = `Repayment: ₳${(Number(invoice.repayment_lovelace) / 1_000_000).toFixed(2)}`;

  const link = document.createElement("a");
  link.className = "nft-link";
  link.textContent = "🔍 View & Verify Invoice Document";
  link.href = openUrl || "#";
  if (openUrl) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  card.append(img, title, p1, p2, link);

  const btn = document.createElement("button");
  btn.className = "btn success";
  btn.textContent = mode === "fund" ? "Fund Invoice" : "Repay";

  btn.addEventListener("click", async () => {
    if (mode === "fund") {
      await fundInvoice(invoice);
    } else {
      await repayInvoice(invoice);
    }
  });

  card.appendChild(btn);
  return card;
}

async function loadInvoices() {
  try {
    if (!lucid || !walletAddress) return;

    const fundContainer = document.getElementById("invoiceGrid");
    const repayContainer = document.getElementById("myinvoiceGrid");
    if (!fundContainer || !repayContainer) return;

    fundContainer.innerHTML = "";
    repayContainer.innerHTML = "";

    const [marketplace, mine] = await Promise.all([
      fetchMarketplaceInvoices(),
      fetchMyFundedInvoices()
    ]);

    if (!marketplace.length) {
      const div = document.createElement("div");
      div.className = "empty-state";
      div.textContent = "No invoices available for funding at the moment.";
      fundContainer.appendChild(div);
    } else {
      for (const invoice of marketplace) {
        fundContainer.appendChild(renderInvoiceCard(invoice, "fund"));
      }
    }

    if (!mine.length) {
      const div = document.createElement("div");
      div.className = "empty-state";
      div.textContent = "You have no funded invoices awaiting repayment.";
      repayContainer.appendChild(div);
    } else {
      for (const invoice of mine) {
        repayContainer.appendChild(renderInvoiceCard(invoice, "repay"));
      }
    }
  } catch (error) {
    console.error("Load Invoices Error:", error);
    log("❌ Error loading invoices: " + error.message);
  }
}

/* =====================================================
   INIT
===================================================== */
async function init() {
  try {
    lucid = await Lucid.new(
      new Blockfrost(BLOCKFROST_URL, BLOCKFROST_KEY),
      NETWORK
    );

    const api = await window.cardano.lace.enable();
    lucid.selectWallet(api);

    walletAddress = await lucid.wallet.address();
    walletPkh = lucid.utils.getAddressDetails(walletAddress).paymentCredential.hash;

    await ensureRegisteredWalletOrFail(walletAddress);

    scriptAddress = lucid.utils.validatorToAddress(invoiceScript);
    nftPolicyId = lucid.utils.mintingPolicyToId(nftPolicy);

    log("✅ Wallet connected successfully");

    await loadInvoices();
    await loadLiveStats();
    await loadRecentTransactions(10);
  } catch (error) {
    console.error(error);
    log("⛔ Wallet connect blocked: " + error.message);
    showModal("Wallet Error", `<p>${escapeHtml(error.message)}</p>`);
  }
}

/* =====================================================
   CREATE INVOICE
===================================================== */
async function createInvoice() {
  try {
    if (!lucid || !walletAddress || !scriptAddress || !nftPolicyId) {
      throw new Error("Please connect your wallet first.");
    }

    const fileInput = document.getElementById("invoiceUpload");
    const faceValueInput = document.getElementById("faceValue");
    const repaymentInput = document.getElementById("repayment");

    if (!fileInput || !faceValueInput || !repaymentInput) {
      throw new Error("Invoice form is missing.");
    }

    if (!fileInput.files || !fileInput.files.length) {
      throw new Error("Please select an invoice document.");
    }

    const faceValueRaw = faceValueInput.value.trim();
    const repaymentRaw = repaymentInput.value.trim();

    if (!faceValueRaw || !repaymentRaw) {
      throw new Error("Please enter both face value and repayment amount.");
    }

    if (Number(repaymentRaw) < Number(faceValueRaw)) {
      throw new Error("Repayment amount must be greater than or equal to face value.");
    }

    const file = fileInput.files[0];
    log("⏳ Uploading invoice document...");
    const upload = await uploadInvoiceFile(file);

    const assetNameHex = upload.file_hash_hex;
    const assetName = nftPolicyId + assetNameHex;
    const documentUrl = safeUrl(upload.document_url);

    const metadata = {
  721: {
    [nftPolicyId]: {
      [assetNameHex]: {
        name: "Invoice NFT",
        image: chunkString(documentUrl),
        mediaType: upload.document_mime,
        files: [
          {
            name: "Invoice Document",
            mediaType: upload.document_mime,
            src: chunkString(documentUrl)
          }
        ]
      }
    }
  }
};

    const faceValueAda = BigInt(faceValueRaw) * 1_000_000n;
    const repayAda = BigInt(repaymentRaw) * 1_000_000n;
    const issuerPkh = lucid.utils.getAddressDetails(walletAddress).paymentCredential.hash;

    const datum = mkInvoiceDatum(
      issuerPkh,
      nftPolicyId,
      assetNameHex,
      faceValueAda,
      repayAda,
      [],
      false
    );

    log("⏳ Building transaction...");
    const tx = await lucid.newTx()
      .mintAssets({ [assetName]: 1n }, nftRedeemer)
      .attachMintingPolicy(nftPolicy)
      .attachMetadata(721, metadata[721])
      .payToContract(
        scriptAddress,
        { inline: datum },
        {
          lovelace: 2_000_000n,
          [assetName]: 1n
        }
      )
      .addSignerKey(issuerPkh)
      .complete();

    const signed = await tx.sign().complete();
    const txHash = await signed.submit();

    await jsonFetch("log_tx.php", {
      method: "POST",
      body: JSON.stringify({
        tx_hash: txHash,
        action_type: "create_invoice",
        invoice_ref: assetName,
        actor_wallet_address: walletAddress,
        counterparty_wallet_address: walletAddress,
        amount_lovelace: "2000000",
        face_value_lovelace: faceValueAda.toString(),
        repayment_lovelace: repayAda.toString(),
        asset_unit: "lovelace",
        document_path: upload.document_path,
        document_url: upload.document_url,
        document_mime: upload.document_mime,
        nft_policy_id: nftPolicyId,
        nft_asset_name: assetNameHex,
        file_hash_hex: upload.file_hash_hex
      })
    });

    log("✅ Invoice created: " + txHash);

    fileInput.value = "";
    faceValueInput.value = "";
    repaymentInput.value = "";

    await loadInvoices();
    await loadLiveStats();
    await loadRecentTransactions(10);
  } catch (error) {
    console.error("Create Invoice Error:", error);
    log("❌ Error: " + error.message);
    showModal("Invoice Creation Failed", `<p>${escapeHtml(error.message)}</p>`);
  }
}

/* =====================================================
   FUND INVOICE
===================================================== */
async function fundInvoice(invoice) {
  try {
    const investorPkh = lucid.utils.getAddressDetails(walletAddress).paymentCredential.hash;
    const found = await findInvoiceUtxo(invoice.invoice_ref);

    if (!found) {
      throw new Error("Could not locate on-chain invoice UTxO.");
    }

    const d = found.datum;
    if (d.idInvestors.length !== 0 || d.isRepaid === true) {
      throw new Error("Invoice is not available for funding.");
    }

    const newDatum = mkInvoiceDatum(
      d.idIssuer,
      d.idInvoiceNFT.currencySymbol,
      d.idInvoiceNFT.tokenName,
      d.idFaceValue,
      d.idRepayment,
      [{ invPkh: investorPkh, invAmount: d.idFaceValue }],
      false
    );

    const issuerAddr = lucid.utils.credentialToAddress({
      type: "Key",
      hash: d.idIssuer,
    });

    const nftUnit = d.idInvoiceNFT.currencySymbol + d.idInvoiceNFT.tokenName;

    const tx = await lucid.newTx()
      .collectFrom([found.utxo], fundRedeemer)
      .attachSpendingValidator(invoiceScript)
      .payToAddress(issuerAddr, { lovelace: d.idFaceValue })
      .payToContract(
        scriptAddress,
        { inline: newDatum },
        {
          lovelace: 2_000_000n,
          [nftUnit]: 1n,
        }
      )
      .addSignerKey(investorPkh)
      .complete();

    const signed = await tx.sign().complete();
    const txHash = await signed.submit();

    await jsonFetch("log_tx.php", {
      method: "POST",
      body: JSON.stringify({
        tx_hash: txHash,
        action_type: "fund_invoice",
        invoice_ref: invoice.invoice_ref,
        actor_wallet_address: walletAddress,
        counterparty_wallet_address: invoice.issuer_wallet_address,
        amount_lovelace: String(invoice.face_value_lovelace),
        asset_unit: "lovelace"
      })
    });

    log("✅ Invoice funded: " + txHash);

    await loadInvoices();
    await loadLiveStats();
    await loadRecentTransactions(10);
  } catch (error) {
    console.error("Fund Invoice Error:", error);
    log("❌ Error: " + error.message);
    showModal("Funding Failed", `<p>${escapeHtml(error.message)}</p>`);
  }
}

/* =====================================================
   REPAY INVOICE
===================================================== */
async function repayInvoice(invoice) {
  try {
    const found = await findInvoiceUtxo(invoice.invoice_ref);

    if (!found) {
      throw new Error("Could not locate on-chain funded invoice UTxO.");
    }

    const d = found.datum;
    if (d.idInvestors.length === 0 || d.isRepaid === true) {
      throw new Error("Invoice is not in a repayable state.");
    }

    let tx = lucid.newTx()
      .collectFrom([found.utxo], repayRedeemer)
      .attachSpendingValidator(invoiceScript);

    let totalPaid = 0n;
    const profit = d.idRepayment - d.idFaceValue;
    const counterpartyAddrs = [];

    for (const inv of d.idInvestors) {
      const payAmount = inv.invAmount + profit;
      const invAddr = lucid.utils.credentialToAddress({
        type: "Key",
        hash: inv.invPkh,
      });
      counterpartyAddrs.push(invAddr);
      totalPaid += payAmount;
      tx = tx.payToAddress(invAddr, { lovelace: payAmount });
    }

    const repaidDatum = mkInvoiceDatum(
      d.idIssuer,
      d.idInvoiceNFT.currencySymbol,
      d.idInvoiceNFT.tokenName,
      d.idFaceValue,
      d.idRepayment,
      d.idInvestors,
      true
    );

    const nftUnit = d.idInvoiceNFT.currencySymbol + d.idInvoiceNFT.tokenName;

    tx = tx.payToContract(
      scriptAddress,
      { inline: repaidDatum },
      {
        lovelace: 2_000_000n,
        [nftUnit]: 1n,
      }
    );

    const completed = await tx.complete();
    const signed = await completed.sign().complete();
    const txHash = await signed.submit();

    await jsonFetch("log_tx.php", {
      method: "POST",
      body: JSON.stringify({
        tx_hash: txHash,
        action_type: "repay_invoice",
        invoice_ref: invoice.invoice_ref,
        actor_wallet_address: walletAddress,
        counterparty_wallet_address: counterpartyAddrs.join(","),
        amount_lovelace: totalPaid.toString(),
        asset_unit: "lovelace"
      })
    });

    log("✅ Invoice repaid & closed: " + txHash);

    await loadInvoices();
    await loadLiveStats();
    await loadRecentTransactions(10);
  } catch (error) {
    console.error("Repay Invoice Error:", error);
    log("❌ Error: " + error.message);
    showModal("Repayment Failed", `<p>${escapeHtml(error.message)}</p>`);
  }
}

/* =====================================================
   STATS / HISTORY
===================================================== */
function formatAdaFromLovelace(lovelaceStr) {
  const lovelace = BigInt(lovelaceStr || "0");
  const ada = Number(lovelace) / 1_000_000;
  return ada.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

async function loadLiveStats() {
  try {
    const res = await fetch("stats.php", {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/json" }
    });

    const out = await res.json().catch(() => null);
    if (!res.ok || !out?.ok) return;

    const totalFundedEl = document.getElementById("statTotalFunded");
    const mintedInvoicesEl = document.getElementById("statMintedInvoices");
    const apyEl = document.getElementById("statAPY");

    if (totalFundedEl) totalFundedEl.textContent = `₳${formatAdaFromLovelace(out.total_funded_lovelace)}`;
    if (mintedInvoicesEl) mintedInvoicesEl.textContent = String(out.minted_invoices || 0);
    if (apyEl) apyEl.textContent = out.current_apy_percent != null ? `${out.current_apy_percent}%` : "--";
  } catch (e) {
    console.error("loadLiveStats error:", e);
  }
}

async function loadRecentTransactions(limit = 10) {
  const body = document.getElementById("recentTxBody");
  if (!body) return;

  try {
    const out = await jsonFetch(`recent_transactions.php?limit=${limit}`, { method: "GET" });
    body.innerHTML = "";

    const rows = out.transactions || [];
    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="6" style="padding:30px;text-align:center;color:#9ca3af;">No transactions yet on the platform.</td></tr>`;
      return;
    }

    for (const t of rows) {
      const tr = document.createElement("tr");

      const created = document.createElement("td");
      created.textContent = formatDateTime(t.created_at);

      const invoice = document.createElement("td");
      invoice.style.color = "#dc2626";
      invoice.style.fontWeight = "700";
      invoice.textContent = shortInvoiceId(t.invoice_ref);

      const type = document.createElement("td");
      type.textContent = prettyType(t.action_type);

      const amount = document.createElement("td");
      amount.textContent = formatAmount(t.amount_lovelace, t.asset_unit);

      const status = document.createElement("td");
      status.innerHTML = statusPill(t.status);

      const hash = document.createElement("td");
      if (t.tx_hash) {
        const a = document.createElement("a");
        a.href = `https://preprod.cardanoscan.io/transaction/${encodeURIComponent(t.tx_hash)}`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "tx-hash-link";
        a.textContent = shortHash(t.tx_hash);
        hash.appendChild(a);
      } else {
        hash.textContent = "-";
      }

      tr.append(created, invoice, type, amount, status, hash);
      body.appendChild(tr);
    }
  } catch (e) {
    console.error("loadRecentTransactions error:", e);
  }
}

async function loadTxHistory() {
  const addrInput = document.getElementById("txAddr");
  const container = document.getElementById("txResults");
  if (!addrInput || !container) return;

  const addr = addrInput.value.trim();
  if (!addr) {
    showModal("Missing Address", "<p>Please paste a wallet address to search.</p>");
    return;
  }

  try {
    const out = await jsonFetch(`tx_history.php?address=${encodeURIComponent(addr)}`, { method: "GET" });
    const list = out.transactions || [];
    container.innerHTML = "";

    if (!list.length) {
      container.innerHTML = `<div class="section-card" style="text-align:center; padding:40px;">No dApp transactions found for this address.</div>`;
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "section-card";

    const table = document.createElement("table");
    table.className = "tx-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>DATE & TIME</th>
          <th>INVOICE ID</th>
          <th>TYPE</th>
          <th>AMOUNT</th>
          <th>STATUS</th>
          <th>TX HASH</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    for (const t of list) {
      const tr = document.createElement("tr");

      const td1 = document.createElement("td");
      td1.textContent = formatDateTime(t.created_at);

      const td2 = document.createElement("td");
      td2.style.color = "#dc2626";
      td2.style.fontWeight = "700";
      td2.textContent = shortInvoiceId(t.invoice_ref);

      const td3 = document.createElement("td");
      td3.textContent = prettyType(t.action_type);

      const td4 = document.createElement("td");
      td4.textContent = formatAmount(t.amount_lovelace, t.asset_unit);

      const td5 = document.createElement("td");
      td5.innerHTML = statusPill(t.status);

      const td6 = document.createElement("td");
      if (t.tx_hash) {
        const a = document.createElement("a");
        a.href = `https://preprod.cardanoscan.io/transaction/${encodeURIComponent(t.tx_hash)}`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "tx-hash-link";
        a.textContent = shortHash(t.tx_hash);
        td6.appendChild(a);
      } else {
        td6.textContent = "-";
      }

      tr.append(td1, td2, td3, td4, td5, td6);
      tbody.appendChild(tr);
    }

    wrapper.appendChild(table);
    container.appendChild(wrapper);
  } catch (e) {
    console.error("loadTxHistory error:", e);
    showModal("Error", `<p>${escapeHtml(e.message)}</p>`);
  }
}

function clearTxHistory() {
  const res = document.getElementById("txResults");
  const addr = document.getElementById("txAddr");
  if (addr) addr.value = "";
  if (res) res.innerHTML = "";
  log("🧹 Search results cleared");
}

async function downloadTxCSV() {
  try {
    const out = await jsonFetch("recent_transactions.php?limit=100", { method: "GET" });
    const rows = out.transactions || [];

    const header = ["created_at","invoice_ref","action_type","amount_lovelace","asset_unit","status","tx_hash"];
    const csv = [
      header.join(","),
      ...rows.map(r => header.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoicefi_transactions_" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("downloadTxCSV error:", e);
  }
}

/* =====================================================
   SAFE EVENT HOOKS
===================================================== */
function attachClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", fn);
}

window.addEventListener("load", () => {
  log("🚀 Dashboard ready. Connect your wallet to continue.");
  loadLiveStats();
  loadRecentTransactions(10);
  setInterval(loadLiveStats, 30000);
  setInterval(() => loadRecentTransactions(10), 30000);
});

attachClick("connect", init);
attachClick("createInvoice", createInvoice);
attachClick("loadTxHistory", loadTxHistory);
attachClick("clearTxHistory", clearTxHistory);
attachClick("downloadTxCSV", downloadTxCSV);