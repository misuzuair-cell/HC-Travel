// 初始化圖標
lucide.createIcons();

const extractBtn = document.getElementById('extractBtn');
const inputText = document.getElementById('inputText');
const resultSection = document.getElementById('resultSection');

// 您的 API 配置 (直接寫入，方便 GitHub 部署)
const DOUBAO_CONFIG = {
    apiKey: '8c059373-bac4-4730-ba53-023ee353505b',
    endpointId: 'ep-20260310180149-r8xmh',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
};

extractBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) {
        alert('請輸入行程內容！');
        return;
    }

    const model = document.querySelector('input[name="aiModel"]:checked').value;
    
    // UI 狀態更新
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<span>提取中...</span>';

    try {
        let resultData;
        if (model === 'doubao') {
            resultData = await callDoubao(text);
        } else {
            // 提示：Gemini 在純前端環境需要額外配置，這裡暫時導向豆包邏輯
            console.log('切換至豆包處理...');
            resultData = await callDoubao(text);
        }
        
        renderResults(resultData);
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error(error);
        alert('提取失敗，請檢查網絡或 API 配置。');
    } finally {
        extractBtn.disabled = false;
        extractBtn.innerHTML = '<i data-lucide="sparkles"></i><span>開始提取信息</span>';
        lucide.createIcons();
    }
});

async function callDoubao(text) {
    const response = await fetch(DOUBAO_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DOUBAO_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: DOUBAO_CONFIG.endpointId,
            messages: [
                { 
                    role: 'system', 
                    content: '你是一個專業旅遊領隊助手。請從輸入內容中提取酒店(name, wifi, breakfast, leaderInfo, phoneInstructions)和明日行程(date, location, morning, afternoon, evening)信息，並以 JSON 格式返回。' 
                },
                { role: 'user', content: text }
            ]
        })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    // 去除 Markdown 代碼塊標記
    const cleanJson = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
}

function renderResults(data) {
    const hotelGrid = document.getElementById('hotelGrid');
    const itineraryGrid = document.getElementById('itineraryGrid');

    // 渲染酒店信息
    const hotel = data.hotel || {};
    const hotelFields = [
        { label: '酒店名稱', value: hotel.name, icon: 'map-pin' },
        { label: 'WiFi 密碼', value: hotel.wifi, icon: 'wifi' },
        { label: '早餐時間/地點', value: hotel.breakfast, icon: 'coffee' },
        { label: '領隊房號', value: hotel.leaderInfo, icon: 'user' },
        { label: '櫃台撥號', value: hotel.phoneInstructions, icon: 'phone' }
    ];

    hotelGrid.innerHTML = hotelFields.map(f => createInfoHtml(f)).join('');

    // 渲染行程信息
    const nextDay = data.nextDay || {};
    const itineraryFields = [
        { label: '日期地點', value: `${nextDay.date || ''} ${nextDay.location || ''}`, icon: 'map' },
        { label: '上午行程', value: nextDay.morning, icon: 'sun' },
        { label: '下午行程', value: nextDay.afternoon, icon: 'cloud-sun' },
        { label: '晚上行程', value: nextDay.evening, icon: 'moon' }
    ];

    itineraryGrid.innerHTML = itineraryFields.map(f => createInfoHtml(f)).join('');
}

function createInfoHtml(item) {
    return `
        <div class="info-item">
            <div class="info-label">
                <i data-lucide="${item.icon}" style="width:14px;height:14px;"></i>
                ${item.label}
            </div>
            <div class="info-value">${item.value || '待確認'}</div>
        </div>
    `;
}