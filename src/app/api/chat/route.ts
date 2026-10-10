import { NextResponse } from 'next/server';
import { fetchDoctors, fetchInsuranceProviders } from '@/lib/db';
import { routeSymptom } from '@/lib/domain/clinical';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { messages } = body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing or empty messages array' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content;
    if (!lastUserMessage || typeof lastUserMessage !== 'string' || !lastUserMessage.trim()) {
      return NextResponse.json({ error: 'Last message content is empty' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

    // Fetch active doctors and insurance from database
    const [doctors, insuranceList] = await Promise.all([
      fetchDoctors({ includeOnLeave: false }),
      fetchInsuranceProviders(),
    ]);

    const specialty = routeSymptom(lastUserMessage);

    let matchedDoctor = doctors.find((d) => {
      const text = `${d.department} ${d.specialization}`.toLowerCase();
      if (specialty === 'Cardiology') return text.includes('cardio');
      if (specialty === 'Pediatrics') return text.includes('child') || text.includes('pediatric');
      if (specialty === 'Neurology') return text.includes('neuro');
      if (specialty === 'Orthopedics') return text.includes('ortho') || text.includes('trauma');
      return text.includes('general') || text.includes('internal');
    }) || doctors[0];

    const dept = matchedDoctor?.department || 'General Medicine';
    const doctorName = matchedDoctor?.name || 'Attending Specialist';
    const fee = matchedDoctor?.consultationFee || 25000;
    const slot = matchedDoctor?.availableSlots?.[0] || '09:00 AM - 09:30 AM';

    const primaryInsurance = insuranceList[0];
    const insuranceCoverage = primaryInsurance ? primaryInsurance.coveragePercentage : 70;
    const discount = Math.round((fee * insuranceCoverage) / 100);
    const finalFee = Math.max(0, fee - discount);

    const systemPrompt = `You are the FITP Clinic AI Concierge and Medical Triage Assistant.
Triage patient symptoms into appropriate clinical specialties (Cardiology, Pediatrics, Neurology, Orthopedics, General Medicine).
Be empathetic, concise, and structured. Always recommend the department, doctor, slot, and insurance co-pay clearly.
CRITICAL: DO NOT use markdown tables (no '|' characters) or markdown headers (no '#' characters) in your response. Instead, format your output as a simple conversational list or plain text paragraphs so it is easy for a human to read.`;

    let content: string | null = null;
    let source: 'groq' | 'clinical-rules-engine' = 'clinical-rules-engine';

    if (apiKey) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            temperature: 0.2,
            max_tokens: 600,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const liveContent = data.choices?.[0]?.message?.content;
          if (liveContent) {
            content = liveContent;
            source = 'groq';
          }
        }
      } catch (err) {
        console.warn('Groq API call failed, falling back to clinical rules:', err);
      }
    }

    if (!content) {
      content = `Based on your described symptoms, our AI Clinical Triage recommends consulting our **${dept}** department.

🔍 **Agentic Clinical Reasoning & Database Match:**
• **Recommended Specialty**: ${dept}
• **Attending Specialist**: ${doctorName}
• **Next Available Slot**: ${slot} (${matchedDoctor?.roomNumber || 'Consultation Suite 101'})
• **Standard Consultation Fee**: ${fee.toLocaleString()} MMK
• **Insurance Coverage (${insuranceCoverage}%)**: -${discount.toLocaleString()} MMK
• **Your Out-of-Pocket Co-Pay**: **${finalFee.toLocaleString()} MMK**

Would you like to proceed with this specialist slot and complete your booking reservation?`;
      source = 'clinical-rules-engine';
    }

    return NextResponse.json({
      content,
      source,
      metadata: {
        department: dept,
        doctorId: matchedDoctor?.id,
        doctorName,
        slot,
        standardFee: fee,
        insuranceDiscount: discount,
        estimatedCoPay: finalFee,
        source,
      },
    });
  } catch (error: any) {
    console.error('Error in AI triage route:', error);
    return NextResponse.json(
      { error: 'Failed to process AI triage query', details: error.message },
      { status: 500 }
    );
  }
}
