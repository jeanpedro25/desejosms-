import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Definir o diretório onde estão os arquivos
DIRETORIO = Path("./Ambiente_Trabalho").absolute()
PORTA = 8080

class MeuHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRETORIO), **kwargs)

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == "__main__":
    os.chdir(DIRETORIO)
    
    print(f"\n{'='*60}")
    print(f" Servidor iniciado em: http://localhost:{PORTA}")
    print(f" Servindo arquivos de: {DIRETORIO}")
    print(f"{'='*60}\n")
    
    # Configurar e iniciar o servidor
    with socketserver.TCPServer(("", PORTA), MeuHandler) as httpd:
        print("Servidor rodando. Pressione Ctrl+C para encerrar.")
        
        # Abrir o navegador automaticamente
        webbrowser.open(f"http://localhost:{PORTA}")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor encerrado pelo usuário.")

