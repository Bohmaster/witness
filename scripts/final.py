#! /usr/bin/python
# -*- encoding: utf-8 -*-
# Importamos los modulos necesarios
import os
from gps import *
from time import *
import time
import threading
import sys

os.chdir('/home/pi/scripts/gps/log/')

gpsd = None #Declaramos la variable GPSD
#os.system('clear') #Limpiamos la terminal
#Este paso es opcional ya que no hace falta que muestre ningun mensaje en la terminal
#Si ponemos el script como un 'daemon'


class GpsPoller(threading.Thread):
        def __init__(self):
                threading.Thread.__init__(self)
                global gpsd #Declaramos GPSD como una variable global
                gpsd = gps(mode=WATCH_ENABLE) #Iniciamos el streaming de datos GPS
                self.current_value = None
                self.running = True

        def run(self):
                global gpsd
                while gpsp.running:
                        gpsd.next() #Esto continuara el loop y recojera todos los datos para limpiar el buffer


if __name__ == '__main__':
        gpsp = GpsPoller() # Creamos el thread para recibir datos del modulo GPS
        try:
                gpsp.start() # Y lo arrancamos
                while True: #Iniciamos un bucle

                        #os.system('clear')#Limpiamos la terminal
                        #Este paso es opcional ya que no hace falta que muestre ningun mensaje en la terminal
                        #Si ponemos el script como un 'daemon'

                       print '{"latitud":"' , gpsd.fix.latitude,'",' #Sacamos por pantalla la latitud
                       print '"longitud":"' , gpsd.fix.longitude,'",' #Sacamos por pantalla la longitud
                       print '"hora":"' , gpsd.utc, '+', gpsd.fix.time,'",' # Sacamos por pantalla la hora
                       print '"velocidad":"', gpsd.fix.speed,'",'

                        #Si la latitud y la longitud son igual a 0.0
                       if gpsd.fix.latitude == 0.0 and gpsd.fix.longitude == 0.0:
                        #Sacamos por pantalla  este mensaje
                              print('"status": "waiting"}')
                       else:
                        #En caso contrario sacamos etse mensaje
                              print('"status": "OK"}')

		       sys.stdout.flush()
				

                       speed = gpsd.fix.speed # guardo la velocidad actual en la variable speed
                       timestr = time.strftime("%Y%m%d-%H%M%S") #guardo la fecha y hora en la variable timestr

                       if speed >= 1.5: #siempre y cuando la velocidad sea mayor a 1 metro por segundo, inicia el logueo

                              data = open(str(timestr) + ".txt", "w") #genero un archivo con la fecha y hora actual como nombre
                              data.write("%s,%s,%s,%s\n" % (gpsd.fix.latitude, gpsd.fix.longitude, gpsd.fix.speed, str(timestr))) # escribo en ese archivo fecha y hora, latitud, longitud y velocidad
                              data.close() #cierro el archivo
                        #Guardamos los datos en un archivo
                       else:
                              pass #Si la velocidad es menor a 1 metro por segundo pasa de largo el registro y
                              time.sleep(10) #espera 10 segundos para hacer la proxima comparacion

        except (KeyboardInterrupt, SystemExit): #Al pulsar ctrl+c
                print "\nDesconectando GPS..."
                gpsp.running = False
                gpsp.join() # Espera a que el thread finalice
        #print "Ok.\nSaliendo..."
