// DEMO 種子資料 — 所有藝術家、作品、商品皆為虛構示意，可替換為 CMS / API adapter
window.TUGO_DATA = {
  cats: [
    { id: 'tees', name: 'T 恤／上衣' }, { id: 'hats', name: '帽子' }, { id: 'bags', name: '包袋' },
    { id: 'stickers', name: '貼紙' }, { id: 'posters', name: '海報／版畫' }, { id: 'living', name: '生活小物' }
  ],
  artists: [
    { id: 'xiaowu', name: '林小霧', en: 'Lin Xiaowu', disc: '插畫', tags: ['插畫', '城市'], line: '畫霧氣裡的城市夜景，和每一隻失眠的貓。', bio: '台北出生、在基隆住了六年的插畫創作者。擅長以低彩度藍紫描繪城市夜晚，作品常出現頂樓、便利商店與不睡覺的貓。', phil: '我想畫的是那些大家都經過、卻沒有停下來看的時刻。', ig: '@xiaowu.fog', city: '基隆', hue: 275 },
    { id: 'atu', name: '阿凸', en: 'ATU', disc: '角色設計', tags: ['角色', '幽默'], line: '一顆很容易生氣的饅頭，和他吵吵鬧鬧的朋友們。', bio: '角色設計師，曾任動畫公司美術。2021 年創造角色「饅頭」，以短篇四格記錄上班族的小情緒。', phil: '生氣也沒關係，生完氣去吃宵夜就好。', ig: '@atu.mantou', city: '台中', hue: 80 },
    { id: 'chenyan', name: '陳硯', en: 'Chen Yan', disc: '木刻版畫', tags: ['版畫', '植物'], line: '用木刻線條，一株一株記錄島嶼上的原生植物。', bio: '版畫創作者，長期田野調查台灣低海拔原生植物，每件作品皆從手繪草稿、刻版到手工拓印完成。', phil: '刻刀慢，但植物長得更慢。我只是試著跟上它們。', ig: '@chenyan.woodcut', city: '花蓮', hue: 150 },
    { id: 'mori', name: '森野', en: 'Mori', disc: '攝影', tags: ['攝影', '日常'], line: '海邊、鐵皮屋，與午後三點剛好斜進來的光。', bio: '底片與數位並用的攝影師，作品聚焦台灣西海岸小鎮的建築與光線。', phil: '光每天都來，只是我們不一定在家。', ig: '@mori.3pm', city: '台南', hue: 225 },
    { id: 'riri', name: '黃日日', en: 'Huang Riri', disc: '字體／平面設計', tags: ['字體', '文字'], line: '把阿嬤常說的台語俗諺，排成好看的字。', bio: '平面設計師，專注中文字體與在地語彙，將台語俗諺重新設計成可以帶在身上的字。', phil: '一句話被好好排版，就會被好好記住。', ig: '@riri.type', city: '台北', hue: 45 },
    { id: 'sura', name: '蘇拉', en: 'Sura', disc: '拼貼／複合媒材', tags: ['拼貼', '復古'], line: '用舊報紙、市場傳單，拼一個有點荒謬的未來。', bio: '拼貼藝術家，蒐集各地傳統市場的傳單與舊報紙，重組成帶有復古未來感的畫面。', phil: '舊東西不是過去，它們只是在等新的排列方式。', ig: '@sura.collage', city: '高雄', hue: 20 }
  ],
  collections: [
    { id: 'night-market', name: '夜市研究所', en: 'Night Market Lab', artists: ['xiaowu', 'atu'], season: '2026 秋冬', hue: 285, concept: '當失眠的貓遇上愛生氣的饅頭，一起去逛凌晨的夜市。', long: '林小霧的藍紫夜景，加上阿凸的饅頭角色，把夜市的燈籠、煙霧和排隊人潮，變成可以穿上身、背出門的故事。系列以低彩度夜色與一抹燈籠橘為主調。' },
    { id: 'island-flora', name: '島嶼植物誌', en: 'Island Flora', artists: ['chenyan'], season: '2026 限定', hue: 150, concept: '一刀一刀刻出的台灣原生植物，從版畫走進日常。', long: '陳硯走訪東部低海拔山林，選出萍蓬草、姑婆芋等原生植物，以木刻版畫為原稿，製作限量簽名版畫與刺繡單品。' },
    { id: 'afternoon-3pm', name: '午後三點', en: '3 PM', artists: ['mori', 'riri'], season: '2026 秋季', hue: 215, concept: '影像與文字的對話：關於慢下來的那一個小時。', long: '森野的西海岸攝影，搭配黃日日設計的台語俗諺字體。一張照片、一句話，提醒自己「慢慢仔來，比較快」。' }
  ],
  products: [
    { id: 'p1', slug: 'sleepless-cat-tee', name: '失眠貓夜景 T 恤', artist: 'xiaowu', cat: 'tees', price: 980, status: 'limited', isNew: true, pop: 92, date: '2026-10-20', colors: ['奶油白', '墨黑'], sizes: ['S', 'M', 'L', 'XL'], coll: 'night-market', stock: 18, material: '100% 精梳棉 230g／m²，水性環保印刷。', care: '反面冷水手洗或洗衣袋輕柔洗，勿烘乾、勿直接熨燙圖案。', dims: '見尺寸表', story: '凌晨兩點的頂樓，一隻貓和整座城市一起醒著。原畫為林小霧的同名插畫，印刷前經藝術家親自校色三次。', hue: 275 },
    { id: 'p2', slug: 'mantou-tote', name: '饅頭生氣中 帆布托特包', artist: 'atu', cat: 'bags', price: 690, status: 'instock', isNew: true, pop: 88, date: '2026-10-18', colors: ['自然米'], sizes: [], coll: 'night-market', stock: 40, material: '12 安士厚磅帆布，內附小口袋。', care: '局部手洗，陰乾。', dims: '寬 38 × 高 40 × 底 10 cm', story: '饅頭今天也很生氣，但他還是幫你裝好了便當、筆電，跟一點點耐心。', hue: 80 },
    { id: 'p3', slug: 'lantern-stickers', name: '夜市燈籠 貼紙組（8 入）', artist: 'atu', cat: 'stickers', price: 180, status: 'instock', isNew: true, pop: 95, date: '2026-10-15', colors: [], sizes: [], coll: 'night-market', stock: 120, material: '霧面防水 PVC，可貼筆電、水壺與行李箱。', care: '避免長時間曝曬。', dims: '每張約 5–7 cm', story: '烤香腸、珍奶、彈珠台，還有一顆在排隊時越來越生氣的饅頭。', hue: 60 },
    { id: 'p4', slug: 'water-lily-print', name: '台灣萍蓬草 木刻版畫', artist: 'chenyan', cat: 'posters', price: 2400, status: 'limited', isNew: true, pop: 70, date: '2026-10-10', colors: [], sizes: ['A3'], coll: 'island-flora', stock: 6, material: '手漉和紙，油性版畫墨，手工拓印；限量 30 張，附簽名與編號。', care: '避免陽光直射與潮濕，建議裱框保存。', dims: '29.7 × 42 cm（不含框）', story: '萍蓬草是台灣特有的水生植物，曾一度瀕臨消失。陳硯在桃園埤塘邊畫了三個夏天的草稿，才刻下這一版。', hue: 150 },
    { id: 'p5', slug: 'taro-leaf-cap', name: '姑婆芋 刺繡老帽', artist: 'chenyan', cat: 'hats', price: 880, status: 'preorder', ship: '2026/12/15', isNew: true, pop: 81, date: '2026-10-22', colors: ['森林綠', '奶油白'], sizes: [], coll: 'island-flora', stock: 0, material: '水洗棉斜紋布，正面電腦刺繡，後方金屬扣可調。', care: '手洗，勿漂白。', dims: '頭圍 56–60 cm 可調', story: '小時候下雨天，阿公會隨手摘一片姑婆芋當傘。這頂帽子把那片葉子繡了回來。', hue: 140 },
    { id: 'p6', slug: '3pm-poster', name: '午後三點 攝影海報', artist: 'mori', cat: 'posters', price: 1200, status: 'instock', isNew: true, pop: 76, date: '2026-10-05', colors: [], sizes: ['A3', 'A2'], coll: 'afternoon-3pm', stock: 25, material: '250g 美術紙，藝術微噴輸出。', care: '避免陽光直射，建議裱框。', dims: 'A3 29.7 × 42 cm／A2 42 × 59.4 cm', story: '台南安平的一面鐵皮牆，下午三點零七分，光剛好斜進來十二分鐘。', hue: 225 },
    { id: 'p7', slug: 'tin-house-longsleeve', name: '鐵皮屋 長袖上衣', artist: 'mori', cat: 'tees', price: 1280, status: 'preorder', ship: '2026/12/05', isNew: true, pop: 64, date: '2026-10-25', colors: ['霧灰', '墨黑'], sizes: ['S', 'M', 'L', 'XL'], coll: 'afternoon-3pm', stock: 0, material: '棉 95%／彈性纖維 5%，背面大圖數位直噴。', care: '反面冷水洗，勿烘乾。', dims: '見尺寸表', story: '西海岸小鎮常見的彩色鐵皮屋，被森野拍成一整個系列。這件把其中一棟穿在你背上。', hue: 215 },
    { id: 'p8', slug: 'slowly-mug', name: '「慢慢仔來」字體馬克杯', artist: 'riri', cat: 'living', price: 520, status: 'instock', isNew: true, pop: 90, date: '2026-09-28', colors: ['奶油白'], sizes: [], coll: 'afternoon-3pm', stock: 32, material: '陶瓷，容量 350 ml，可微波。', care: '建議手洗以保持字體印刷完整。', dims: '直徑 8.5 × 高 9.5 cm', story: '「慢慢仔來，比較快。」黃日日把阿嬤最常說的這句話，設計成每天早上會看到的字。', hue: 45 },
    { id: 'p9', slug: 'ho-ka-tsai-hat', name: '「好佳哉」漁夫帽', artist: 'riri', cat: 'hats', price: 820, status: 'soldout', isNew: false, pop: 85, date: '2026-08-30', colors: ['磚紅'], sizes: ['M', 'L'], coll: null, stock: 0, material: '棉麻混紡，帽簷內縫字體織標。', care: '手洗，平放陰乾。', dims: 'M 頭圍 57 cm／L 頭圍 59 cm', story: '好佳哉——幸好。給每一個差點遲到、但還是趕上了的早晨。', hue: 30 },
    { id: 'p10', slug: 'market-flyer-backpack', name: '市場傳單拼貼 束口後背包', artist: 'sura', cat: 'bags', price: 760, status: 'instock', isNew: false, pop: 72, date: '2026-09-15', colors: ['自然米'], sizes: [], coll: null, stock: 22, material: '再生聚酯纖維，滿版熱昇華印刷。', care: '手洗，陰乾。', dims: '寬 35 × 高 45 cm', story: '高雄三民市場的特價傳單、舊報紙分類廣告，被蘇拉剪成一張奇怪又熱鬧的未來地圖。', hue: 20 },
    { id: 'p11', slug: 'future-breakfast-stickers', name: '未來早餐店 貼紙組（6 入）', artist: 'sura', cat: 'stickers', price: 160, status: 'limited', isNew: false, pop: 68, date: '2026-09-20', colors: [], sizes: [], coll: null, stock: 9, material: '亮面防水 PVC。', care: '避免長時間曝曬。', dims: '每張約 6 cm', story: '2087 年的早餐店，還是賣蘿蔔糕加蛋，只是老闆娘換成了機器人。', hue: 10 },
    { id: 'p12', slug: 'fog-city-coasters', name: '霧夜城市 陶瓷杯墊組（2 入）', artist: 'xiaowu', cat: 'living', price: 450, status: 'instock', isNew: false, pop: 60, date: '2026-09-10', colors: [], sizes: [], coll: null, stock: 15, material: '吸水陶瓷，底部軟木防滑。', care: '濕布擦拭即可。', dims: '直徑 10 cm', story: '兩片杯墊、兩個窗口，一個看港口，一個看便利商店。', hue: 265 }
  ],
  sizeChart: [['S', '50', '68'], ['M', '53', '71'], ['L', '56', '74'], ['XL', '59', '76']],
  swatch: { '奶油白': '#F4EFE5', '墨黑': '#242622', '森林綠': '#244A3A', '自然米': '#E4D8C0', '霧灰': '#A9ADA6', '磚紅': '#A5563C' },
  faq: [
    { q: '商品是正版授權嗎？', a: '正式營運後，所有商品皆在與藝術家簽訂授權合約後製作，並標示創作者署名。目前網站內的藝術家與商品皆為示意資料。' },
    { q: '預購商品什麼時候出貨？', a: '每件預購商品頁都會標示預計出貨日，若有延遲將以 Email 主動通知（通知功能待串接）。' },
    { q: '可以退換貨嗎？', a: '依消費者保護法享有七天猶豫期（非試用期）。限量簽名版畫等個別商品若有例外規定，會在商品頁清楚標示。' },
    { q: '運費怎麼計算？', a: '宅配 NT$100、超商取貨 NT$60，單筆滿 NT$1,500 免運（示意規則）。' },
    { q: '可以開立統一編號發票嗎？', a: '電子發票功能待串接，正式上線後可於結帳時填寫統一編號。' },
    { q: '我是創作者，要怎麼合作？', a: '請至「藝術家合作」頁面填寫申請表，團隊會在初審後與你聯繫。' }
  ],
  info: {
    shipping: { title: '配送說明', sections: [['配送方式', '提供宅配到府與超商取貨（7-ELEVEN、全家）。物流服務尚待串接，以下為示意規則。'], ['運費', '宅配 NT$100、超商取貨 NT$60；單筆訂單滿 NT$1,500 免運。'], ['出貨時間', '現貨商品於付款完成後 3 個工作天內出貨；預購商品依商品頁標示之預計出貨日陸續寄出。'], ['離島與海外', '離島及海外配送尚未開放，正式上線前將另行公告。']] },
    returns: { title: '退換貨政策', sections: [['七天猶豫期', '依消費者保護法，收到商品次日起七天內可申請退貨；猶豫期並非試用期，商品須保持全新狀態與完整包裝。'], ['例外情形', '依「通訊交易解除權合理例外情事適用準則」，部分客製或易於複製之商品可能不適用，將於商品頁事先標示。'], ['申請方式', '線上退換貨申請功能待串接；正式上線前請以客服信箱聯繫（示意）。'], ['退款', '確認退貨商品後，依原付款方式退款，時間依金流服務商規定。']] },
    privacy: { title: '隱私權政策', sections: [['蒐集目的', '處理訂單、配送、客服、電子報寄送與藝術家合作申請。'], ['蒐集類別', '姓名、聯絡方式、收件資訊、訂單紀錄，以及合作申請所提供之作品集連結。'], ['利用期間與方式', '於蒐集目的存續期間內，僅用於上述目的，不會販售予第三方。'], ['你的權利', '你可隨時請求查詢、更正、停止利用或刪除個人資料。']] },
    terms: { title: '服務條款', sections: [['服務說明', '本網站提供原創藝術家聯名商品之瀏覽與購買服務。目前為示意版本，尚未開放實際交易。'], ['商品與價格', '商品價格以新台幣（NT$）計價，實際售價以結帳頁面為準。'], ['智慧財產權', '網站中所有作品著作權屬原創作者所有，未經授權不得重製、改作或商業使用。'], ['準據法', '本條款以中華民國法律為準據法。']] }
  }
};
