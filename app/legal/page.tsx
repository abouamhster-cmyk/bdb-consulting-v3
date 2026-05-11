'use client';

import Link from 'next/link';
import { Shield, FileText, ArrowRight } from 'lucide-react';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Informations légales</h1>
        <p className="text-gray-500 mb-8">Documents contractuels et conformité</p>

        <div className="grid gap-4">
          <Link href="/legal/privacy" className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-900">Politique de confidentialité</h2>
                <p className="text-sm text-gray-500">Comment nous protégeons vos données</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link href="/legal/terms" className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-900">Conditions Générales d'Utilisation</h2>
                <p className="text-sm text-gray-500">Les règles d'utilisation de la plateforme</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}