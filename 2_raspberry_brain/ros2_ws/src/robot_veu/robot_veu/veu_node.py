




# AIXO ESTA FATAL, PERO SERVEIX D ESQUELET DE REFERENCIA PER CONTROLAR LA VEU DEL ROBOT
# CAL ADAPTAR EL CODI DE RECONEIXAMENT DE VEU I SÍNTESI DE VEU AQUI






import rclpy
from rclpy.node import Node
from std_msgs.msg import String

# Llibreries de veu
import speech_recognition as sr    # escoltar micròfon → text
import pyttsx3                      # text → parla

# ─────────────────────────────────────────────────────────────────
# INTEGRACIÓ AMB GEMINI
# ─────────────────────────────────────────────────────────────────

#SI AL FINAL ULTILIZEM TMB GEMINI DONCS VA AQUI AMB UN TODO

# ─────────────────────────────────────────────────────────────────
# PARÀMETRES
# ─────────────────────────────────────────────────────────────────
ROBOT_REAL = False   # False = simulació, True = robot real
IDIOMA     = 'ca-ES' # català, canvia a 'es-ES' per castellà


class VeuNode(Node):

    def __init__(self):
        super().__init__('veu_node')
        self.get_logger().info('Veu Node iniciat!')

        # ── Publishers ─────────────────────────────────────────
        # Publica el que ha entès el robot → altres nodes ho llegeixen
        self.pub_ordre = self.create_publisher(String, '/veu/ordre', 10)

        # ── Subscribers ────────────────────────────────────────
        # Rep el nom de la persona detectada per la càmera
        # Quan detecta una persona, la saluda pel nom
        self.sub_persona = self.create_subscription(
            String, '/persona_detectada', self.callback_persona, 10)

        # ── Inicialitzar veu ───────────────────────────────────
        if ROBOT_REAL:
            # Motor de text a veu
            self.tts = pyttsx3.init()
            self.tts.setProperty('rate', 150)   # velocitat de parla

            # Reconeixement de veu
            self.recognizer = sr.Recognizer()
            self.microphone  = sr.Microphone()

            self.get_logger().info('Sistema de veu inicialitzat!')
        else:
            self.tts        = None
            self.recognizer = None
            self.microphone = None

        self.persona_actual = None  # persona detectada per la càmera

        # Timer — escolta el micròfon cada 2 segons
        self.timer = self.create_timer(2.0, self.update)

    # ─────────────────────────────────────────────────────────────
    # ESCOLTA EL MICRÒFON
    # ─────────────────────────────────────────────────────────────
    def update(self):
        """
        Escolta el micròfon i publica el que ha entès.
        En mode simulació no fa res.
        """
        if not ROBOT_REAL:
            return

        try:
            with self.microphone as font:
                self.recognizer.adjust_for_ambient_noise(font, duration=0.5)
                audio = self.recognizer.listen(font, timeout=3)

            text = self.recognizer.recognize_google(audio, language=IDIOMA)
            self.get_logger().info(f'Escoltat: "{text}"')

            # Publiquem el que hem entès
            msg = String()
            msg.data = text
            self.pub_ordre.publish(msg)

            # Decidim resposta
            self._decideix_resposta(text)

        except sr.WaitTimeoutError:
            pass  # no ha dit res, és normal
        except sr.UnknownValueError:
            pass  # no ha entès res
        except Exception as e:
            self.get_logger().warn(f'Error veu: {e}')

    # ─────────────────────────────────────────────────────────────
    # CALLBACKS
    # ─────────────────────────────────────────────────────────────
    def callback_persona(self, msg):
        """
        Rep el nom de la persona detectada per la càmera.
        Si és una persona nova, la saluda.
        """
        persona = msg.data
        if persona != self.persona_actual and persona != 'desconegut':
            self.persona_actual = persona
            self.get_logger().info(f'Persona detectada: {persona}')
            self._parla(f'Hola {persona}, com estàs?')

    # ─────────────────────────────────────────────────────────────
    # FUNCIONS DE VEU
    # ─────────────────────────────────────────────────────────────
    def _parla(self, text):
        """Fa parlar el robot."""
        self.get_logger().info(f'Parlant: "{text}"')
        if ROBOT_REAL and self.tts:
            self.tts.say(text)
            self.tts.runAndWait()

    def _decideix_resposta(self, text):
        """
        Decideix què fer segons el que ha escoltat.
        Per situacions complexes, consulta Gemini.
        """
        text = text.lower()

        # Respostes simples directes
        if 'hola' in text:
            self._parla('Hola! Com puc ajudar-te?')

        elif 'adéu' in text or 'fins aviat' in text:
            self._parla('Fins aviat!')

        elif 'com et dius' in text:
            self._parla('Em dic Care-E, el teu robot assistent.')

        elif 'ajuda' in text or 'auxili' in text:
            self._parla('Avisant al personal!')
            # TODO: publicar alerta a /alertes

        else:
            # Situació complexa → consultem Gemini
            # TODO: descomentar quan Gemini estigui integrat
            # resposta = consulta_gemini(text)
            # self._parla(resposta)
            self._parla('No t\'he entès bé, pots repetir-ho?')

    def destroy_node(self):
        self.get_logger().info('Veu Node aturat.')
        super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = VeuNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()