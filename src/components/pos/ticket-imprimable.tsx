"use client";

import React, { forwardRef } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export interface TicketProps {
  boutique: {
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    ticketMessage?: string | null;
  };
  commandeCode: string;
  date: string;
  lignes: {
    nom: string;
    quantite: number;
    prixUnitaire: number;
  }[];
  total: number;
  remise: number;
  montantRecu?: number;
  monnaieRendue?: number;
  vendeurNom: string;
}

export const TicketImprimable = forwardRef<HTMLDivElement, TicketProps>(
  ({ boutique, commandeCode, date, lignes, total, remise, montantRecu, monnaieRendue, vendeurNom }, ref) => {
    // Largeur de 58mm correspond environ à 200px-220px. 80mm = ~300px
    return (
      <div
        ref={ref}
        className="print-ticket"
        style={{
          width: "300px",
          padding: "20px",
          backgroundColor: "white",
          color: "black",
          fontFamily: "monospace",
          fontSize: "12px",
          lineHeight: "1.4",
          margin: "0 auto",
        }}
      >
        {/* En-tête */}
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{boutique.nom}</h2>
          {boutique.adresse && <div style={{ whiteSpace: "pre-wrap" }}>{boutique.adresse}</div>}
          {boutique.telephone && <div>Tél: {boutique.telephone}</div>}
        </div>

        {/* Méta-données */}
        <div style={{ borderBottom: "1px dashed black", paddingBottom: "10px", marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Ticket:</span>
            <span>{commandeCode}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Date:</span>
            <span>{formatDateTime(new Date(date))}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Caissier:</span>
            <span>{vendeurNom}</span>
          </div>
        </div>

        {/* Lignes d'articles */}
        <div style={{ borderBottom: "1px dashed black", paddingBottom: "10px", marginBottom: "10px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px dashed black" }}>
                <th style={{ textAlign: "left", paddingBottom: "4px" }}>Qté</th>
                <th style={{ textAlign: "left", paddingBottom: "4px" }}>Article</th>
                <th style={{ textAlign: "right", paddingBottom: "4px" }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={i}>
                  <td style={{ verticalAlign: "top" }}>{l.quantite}x</td>
                  <td style={{ verticalAlign: "top", paddingRight: "5px" }}>{l.nom}</td>
                  <td style={{ verticalAlign: "top", textAlign: "right" }}>
                    {formatCurrency(l.quantite * l.prixUnitaire)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div style={{ marginBottom: "15px" }}>
          {remise > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Remise:</span>
              <span>-{formatCurrency(remise)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginTop: "5px" }}>
            <span>TOTAL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {montantRecu !== undefined && montantRecu > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
                <span>Reçu:</span>
                <span>{formatCurrency(montantRecu)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Monnaie:</span>
                <span>{formatCurrency(monnaieRendue || 0)}</span>
              </div>
            </>
          )}
        </div>

        {/* Pied de page */}
        <div style={{ textAlign: "center", borderTop: "1px dashed black", paddingTop: "10px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>MERCI DE VOTRE VISITE</div>
          {boutique.ticketMessage && <div style={{ fontSize: "10px", whiteSpace: "pre-wrap" }}>{boutique.ticketMessage}</div>}
          <div style={{ fontSize: "10px", marginTop: "10px" }}>Logiciel: GestionPro</div>
        </div>
      </div>
    );
  }
);
TicketImprimable.displayName = "TicketImprimable";
