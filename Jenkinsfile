node {
  checkout scm
  withCredentials([usernamePassword(credentialsId: 'docker', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
    sh("docker login -u ${env.DOCKER_USERNAME} -p ${env.DOCKER_PASSWORD} registry.aliyuncs.com")
  }
  sh("docker build -t xiaolusys-ui:latest .")
  sh("docker tag xiaolusys-ui:latest registry.aliyuncs.com/xiaolu-img/xiaolusys-ui:latest")
  sh("docker push registry.aliyuncs.com/xiaolu-img/xiaolusys-ui:latest")
}

